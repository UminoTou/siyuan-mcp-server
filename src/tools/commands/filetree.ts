import { z } from 'zod';
import { createHandler, client } from '../../utils/client.js';
import { registry, CommandHandler, McpResponse } from '../../utils/registry.js';

const namespace = 'filetree';

// Create document with Markdown
const createDocWithMdHandler: CommandHandler = {
    namespace,
    name: 'createDocWithMd',
    description: 'Create a document with Markdown content',
    params: z.object({
        notebook: z.string().describe('Notebook ID'),
        path: z.string().describe('Document path'),
        markdown: z.string().describe('Markdown content')
    }),
    handler: createHandler('/api/filetree/createDocWithMd'),
    documentation: {
        description: 'Create a document with Markdown content',
        params: {
            notebook: {
                type: 'string',
                description: 'Notebook ID',
                required: true
            },
            path: {
                type: 'string',
                description: 'Document path',
                required: true
            },
            markdown: {
                type: 'string',
                description: 'Markdown content',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {
                id: 'Document ID'
            }
        },
        examples: [
            {
                description: 'This example demonstrates creating a new document with a markdown heading, specifying both the target notebook and the document path.',
                params: {
                    notebook: "20210817205410-2kvfpfn",
                    path: "/test/doc.md",
                    markdown: "# Hello World"
                },
                response: {
                    id: "20210817205410-2kvfpfn"
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#create-document-with-markdown'
    }
};

// Rename document
const renameDocHandler: CommandHandler = {
    namespace,
    name: 'renameDoc',
    description: 'Rename a document',
    params: z.object({
        notebook: z.string().describe('Notebook ID'),
        path: z.string().describe('Document path'),
        title: z.string().describe('New document title')
    }),
    handler: createHandler('/api/filetree/renameDoc'),
    documentation: {
        description: 'Rename a document',
        params: {
            notebook: {
                type: 'string',
                description: 'Notebook ID',
                required: true
            },
            path: {
                type: 'string',
                description: 'Document path',
                required: true
            },
            title: {
                type: 'string',
                description: 'New document title',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {}
        },
        examples: [
            {
                description: 'This example shows how to change the title of an existing document while maintaining its location in the notebook hierarchy.',
                params: {
                    notebook: "20210817205410-2kvfpfn",
                    path: "/test/doc.md",
                    title: "New Title"
                },
                response: {}
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#rename-document'
    }
};

// Remove document
const removeDocHandler: CommandHandler = {
    namespace,
    name: 'removeDoc',
    description: 'Remove a document',
    params: z.object({
        notebook: z.string().describe('Notebook ID'),
        path: z.string().describe('Document path')
    }),
    handler: createHandler('/api/filetree/removeDoc'),
    documentation: {
        description: 'Remove a document',
        params: {
            notebook: {
                type: 'string',
                description: 'Notebook ID',
                required: true
            },
            path: {
                type: 'string',
                description: 'Document path',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {}
        },
        examples: [
            {
                description: 'This example demonstrates deleting a document from a specific notebook, removing it from the file tree structure.',
                params: {
                    notebook: "20210817205410-2kvfpfn",
                    path: "/test/doc.md"
                },
                response: {}
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#remove-document'
    }
};

// Remove document recursively (including all sub-documents)
const removeDocRecursiveHandler: CommandHandler = {
    namespace,
    name: 'removeDocRecursive',
    description: 'Recursively remove a document and all its sub-documents',
    params: z.object({
        notebook: z.string().describe('Notebook ID'),
        path: z.string().describe('Document path (e.g., /parent/doc)')
    }),
    handler: async (params): Promise<McpResponse> => {
        try {
            const { notebook, path } = params as { notebook: string; path: string };

            // Step 1: Locate the target document by hpath to get its internal .sy path
            const safePath = path.replace(/'/g, "''");
            const safeNotebook = notebook.replace(/'/g, "''");
            const findDocSql = `SELECT id, path, content FROM blocks WHERE box = '${safeNotebook}' AND type = 'd' AND hpath = '${safePath}' LIMIT 1`;
            const findDocResult = await client.post('/api/query/sql', { stmt: findDocSql });

            if (findDocResult.code !== 0 || !findDocResult.data || findDocResult.data.length === 0) {
                return {
                    content: [{ type: 'text', text: JSON.stringify({ code: 404, msg: 'Document not found', data: null }) }]
                };
            }

            const rootDoc = findDocResult.data[0];
            const rootFilePath = rootDoc.path.replace(/\.sy$/, '');

            // Step 2: Fetch the entire subtree (including self) ordered by depth descending
            const childrenSql = `SELECT id, content FROM blocks WHERE box = '${safeNotebook}' AND type = 'd' AND (path = '${rootDoc.path}' OR path LIKE '${rootFilePath}/%') ORDER BY LENGTH(path) DESC`;
            const childrenResult = await client.post('/api/query/sql', { stmt: childrenSql });

            if (childrenResult.code !== 0) {
                return {
                    content: [{ type: 'text', text: JSON.stringify(childrenResult) }],
                    isError: true
                };
            }

            const docs = childrenResult.data || [];
            const deleted: string[] = [];
            const failed: string[] = [];

            // Step 3: Delete from deepest to shallowest via removeDocByID
            for (const doc of docs) {
                try {
                    const deleteResult = await client.post('/api/filetree/removeDocByID', { id: doc.id });
                    if (deleteResult.code === 0) {
                        deleted.push(doc.content);
                    } else {
                        failed.push(`${doc.content}: ${deleteResult.msg}`);
                    }
                } catch (e: any) {
                    failed.push(`${doc.content}: ${e.message}`);
                }
            }

            const result = {
                code: 0,
                msg: `Deleted ${deleted.length} documents${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
                data: { total: docs.length, deleted, failed: failed.length > 0 ? failed : undefined }
            };

            return {
                content: [{ type: 'text', text: JSON.stringify(result) }],
                _meta: result
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: JSON.stringify({ code: 1, msg: error.message }) }],
                isError: true
            };
        }
    },
    documentation: {
        description: 'Recursively remove a document and all its sub-documents by querying the document tree and deleting from the deepest level upward.',
        params: {
            notebook: {
                type: 'string',
                description: 'Notebook ID',
                required: true
            },
            path: {
                type: 'string',
                description: 'Document path (human-readable, e.g., "/parent/doc")',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result with deleted count',
            properties: {
                total: 'Total documents found',
                deleted: 'Names of successfully deleted documents',
                failed: 'List of deletion failures (if any)'
            }
        },
        examples: [
            {
                description: 'This example demonstrates recursively deleting a document and all its sub-documents, removing the entire tree from the notebook.',
                params: {
                    notebook: "20210817205410-2kvfpfn",
                    path: "/test/parent-doc"
                },
                response: {
                    code: 0,
                    msg: "Deleted 3 documents",
                    data: { total: 3, deleted: ["parent-doc", "child-1", "child-2"] }
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#remove-a-document'
    }
};

// Move documents
const moveDocsHandler: CommandHandler = {
    namespace,
    name: 'moveDocs',
    description: 'Move documents',
    params: z.object({
        fromPaths: z.array(z.string()).describe('Source document paths'),
        toNotebook: z.string().describe('Target notebook ID'),
        toPath: z.string().describe('Target document path')
    }),
    handler: createHandler('/api/filetree/moveDocs'),
    documentation: {
        description: 'Move documents',
        params: {
            fromPaths: {
                type: 'array',
                description: 'Source document paths',
                required: true
            },
            toNotebook: {
                type: 'string',
                description: 'Target notebook ID',
                required: true
            },
            toPath: {
                type: 'string',
                description: 'Target document path',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {}
        },
        examples: [
            {
                description: 'This example shows how to relocate multiple documents to a new location within a target notebook, preserving their content and relationships.',
                params: {
                    fromPaths: ["/test/doc1.md", "/test/doc2.md"],
                    toNotebook: "20210817205410-2kvfpfn",
                    toPath: "/target/path"
                },
                response: {}
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#move-documents'
    }
};

// Get document HPath by path
const getHPathByPathHandler: CommandHandler = {
    namespace,
    name: 'getHPathByPath',
    description: 'Get document HPath by path',
    params: z.object({
        notebook: z.string().describe('Notebook ID'),
        path: z.string().describe('Document path')
    }),
    handler: createHandler('/api/filetree/getHPathByPath'),
    documentation: {
        description: 'Get document HPath by path',
        params: {
            notebook: {
                type: 'string',
                description: 'Notebook ID',
                required: true
            },
            path: {
                type: 'string',
                description: 'Document path',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {
                hPath: 'Document HPath'
            }
        },
        examples: [
            {
                description: 'This example retrieves the human-readable path of a document using its notebook ID and file path, useful for displaying document locations.',
                params: {
                    notebook: "20210817205410-2kvfpfn",
                    path: "/test/doc.md"
                },
                response: {
                    hPath: "/Test/Doc"
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#get-human-readable-path'
    }
};

// Get document HPath by ID
const getHPathByIDHandler: CommandHandler = {
    namespace,
    name: 'getHPathByID',
    description: 'Get document HPath by ID',
    params: z.object({
        id: z.string().describe('Document ID')
    }),
    handler: createHandler('/api/filetree/getHPathByID'),
    documentation: {
        description: 'Get document HPath by ID',
        params: {
            id: {
                type: 'string',
                description: 'Document ID',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {
                hPath: 'Document HPath'
            }
        },
        examples: [
            {
                description: 'This example demonstrates getting the human-readable path of a document using only its unique identifier, regardless of its notebook location.',
                params: {
                    id: "20210817205410-2kvfpfn"
                },
                response: {
                    hPath: "/Test/Doc"
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#get-human-readable-path-by-id'
    }
};

// Register all filetree related commands
export function registerFiletreeHandlers() {
    registry.registerCommand(createDocWithMdHandler);
    registry.registerCommand(renameDocHandler);
    registry.registerCommand(removeDocHandler);
    registry.registerCommand(removeDocRecursiveHandler);
    registry.registerCommand(moveDocsHandler);
    registry.registerCommand(getHPathByPathHandler);
    registry.registerCommand(getHPathByIDHandler);
} 