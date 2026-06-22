import { z } from 'zod';
import { client } from '../../utils/client.js';
import { registry } from '../../utils/registry.js';
import { CommandHandler, McpResponse } from '../../utils/registry.js';

const namespace = 'search';

// 非文本块类型，这些块在搜索结果中会导致 MCP 序列化失败
const NON_TEXT_TYPES = new Set([
    'img', 'image', 'audio', 'video', 'widget', 'iframe'
]);

// 用户传入的 types 短名 → 思源 API 的 types 对象 key 映射
const TYPES_MAP: Record<string, string> = {
    'doc': 'document',
    'heading': 'heading',
    'paragraph': 'paragraph',
    'list': 'list',
    'listItem': 'listItem',
    'code': 'codeBlock',
    'codeBlock': 'codeBlock',
    'html': 'htmlBlock',
    'htmlBlock': 'htmlBlock',
    'math': 'mathBlock',
    'mathBlock': 'mathBlock',
    'table': 'table',
    'quote': 'blockquote',
    'blockquote': 'blockquote',
    'super': 'superBlock',
    'superBlock': 'superBlock',
    'embed': 'embedBlock',
    'embedBlock': 'embedBlock',
    'database': 'databaseBlock',
    'databaseBlock': 'databaseBlock',
};

// Full text search
const fullTextSearchHandler: CommandHandler = {
    namespace,
    name: 'fullTextSearch',
    description: 'Full text search',
    params: z.object({
        query: z.string().describe('Search query'),
        method: z.number().optional().describe('Search method: 0 keyword, 1 query, 2 regex'),
        types: z.array(z.string()).optional().describe('Search types'),
        paths: z.array(z.string()).optional().describe('Search paths'),
        groupBy: z.number().optional().describe('Group by: 0 none, 1 notebook'),
        orderBy: z.number().optional().describe('Order by: 0 none, 1 name, 2 size, 3 updated'),
        page: z.number().optional().describe('Page number'),
        limit: z.number().optional().describe('Results per page')
    }),
    handler: async (rawParams): Promise<McpResponse> => {
        const params = rawParams as {
            query: string;
            method?: number;
            types?: string[];
            paths?: string[];
            groupBy?: number;
            orderBy?: number;
            page?: number;
            limit?: number;
        };
        try {
            // 转换参数格式以匹配思源 API
            const apiParams: Record<string, unknown> = {
                query: params.query,
                method: params.method ?? 0,
                page: params.page ?? 1,
                pageSize: params.limit ?? 32,
            };
            if (params.paths) apiParams.paths = params.paths;
            if (params.groupBy !== undefined) apiParams.groupBy = params.groupBy;
            if (params.orderBy !== undefined) apiParams.orderBy = params.orderBy;
            if (params.types?.length) {
                apiParams.types = {};
                for (const t of params.types) {
                    const key = TYPES_MAP[t] || t;
                    (apiParams.types as Record<string, boolean>)[key] = true;
                }
            }

            const response = await client.post('/api/search/fullTextSearchBlock', apiParams);
            const data = response?.data;

            if (data && Array.isArray(data.blocks)) {
                const originalCount = data.blocks.length;
                data.blocks = data.blocks.filter(
                    (block: any) => block.type && !NON_TEXT_TYPES.has(block.type)
                );
                data.filteredCount = originalCount - data.blocks.length;
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(data ?? response ?? {})
                }]
            };
        } catch (error: any) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        code: 1,
                        msg: error.message || 'Search failed'
                    })
                }],
                isError: true
            };
        }
    },
    documentation: {
        description: 'Full text search',
        params: {
            query: {
                type: 'string',
                description: 'Search query',
                required: true
            },
            method: {
                type: 'number',
                description: 'Search method: 0 keyword, 1 query, 2 regex',
                required: false
            },
            types: {
                type: 'array',
                description: 'Search types',
                required: false
            },
            paths: {
                type: 'array',
                description: 'Search paths',
                required: false
            },
            groupBy: {
                type: 'number',
                description: 'Group by: 0 none, 1 notebook',
                required: false
            },
            orderBy: {
                type: 'number',
                description: 'Order by: 0 none, 1 name, 2 size, 3 updated',
                required: false
            },
            page: {
                type: 'number',
                description: 'Page number',
                required: false
            },
            limit: {
                type: 'number',
                description: 'Results per page',
                required: false
            }
        },
        returns: {
            type: 'object',
            description: 'Search results',
            properties: {
                blocks: 'Array of matched blocks',
                matchedBlockCount: 'Total number of matched blocks',
                matchedRootCount: 'Total number of matched root blocks'
            }
        },
        examples: [
            {
                description: 'This example performs a keyword-based search across documents and headings in a specific path, grouping results by notebook and returning the first page of 10 matches.',
                params: {
                    query: "keyword",
                    method: 0,
                    types: ["doc", "heading"],
                    paths: ["/path/to/search"],
                    groupBy: 1,
                    orderBy: 0,
                    page: 1,
                    limit: 10
                },
                response: {
                    blocks: [
                        {
                            id: "20200812220555-lj3enxa",
                            content: "Block content with keyword"
                        }
                    ],
                    matchedBlockCount: 1,
                    matchedRootCount: 1
                }
            }
        ],
        apiLink: 'https://deepwiki.com/siyuan-note/siyuan/8.1-full-text-search'
    }
};

// Register all search related commands
export function registerSearchHandlers() {
    registry.registerCommand(fullTextSearchHandler);
} 