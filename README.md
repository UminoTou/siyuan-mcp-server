<div align="center">
  
  # 🧠 思源笔记 MCP 服务器
  
  **为 Claude Code / Claude Desktop 提供思源笔记集成的 Model Context Protocol 服务器**
  
  [![npm version](https://img.shields.io/npm/v/@uminotou/siyuan-mcp-server.svg)](https://www.npmjs.com/package/@uminotou/siyuan-mcp-server)
  [![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
  
  🚀 让 AI 助手直接管理您的思源笔记
  
</div>

---

## 📖 项目介绍

**思源笔记 MCP 服务器** 是一个专为 [思源笔记](https://b3log.org/siyuan/) 设计的 Model Context Protocol 服务器实现。通过此服务器，您可以在 Claude Desktop 或 Claude Code 等支持 MCP 的 AI 客户端中直接操作思源笔记，实现笔记管理、内容搜索、文档编辑等功能的无缝集成。

### ✨ 主要特性

- 🔗 **原生集成** - 在 AI 助手中直接操作思源笔记
- 📚 **功能完整** - 支持笔记本、文档、块级操作的全套功能
- 🔍 **智能搜索** - 全文检索、SQL 查询、标签搜索等多种搜索方式
- 🛠️ **开发者友好** - TypeScript 编写，提供完整的类型定义和 API 文档
- 📦 **简单部署** - 支持 npm、Docker 多种安装方式
- 🔒 **安全认证** - 基于 Token 的安全认证机制

## 🚀 快速开始

### 📋 环境要求

- **Node.js** >= 18.0.0
- **思源笔记** 正在运行且已开启 API 服务
- **Claude Code** / **Claude Desktop** 或其他支持 MCP 的客户端
- 思源笔记 API Token（设置 → 关于 → API token）

### 📥 安装方式

#### 1. 全局安装（推荐）

```bash
# 使用 npm
npm install -g @uminotou/siyuan-mcp-server

# 使用 pnpm
pnpm add -g @uminotou/siyuan-mcp-server
```

#### 2. 直接使用（无需安装）

```bash
npx @uminotou/siyuan-mcp-server
```

#### 3. Docker 方式

```bash
docker pull UminoTou/siyuan-mcp-server
```

### ⚙️ 快速配置

#### 环境变量设置

| 环境变量         | 必需 | 说明                                      |
| ---------------- | ---- | ----------------------------------------- |
| `SIYUAN_TOKEN`   | ✅   | 思源笔记 API 令牌，用于身份验证           |
| `SIYUAN_API_URL` | ❌   | 思源笔记 API 地址，默认为 http://localhost:6806，可用于连接远程思源笔记服务 |

#### 在 Claude Code 中配置

**第一步：** 在你的项目根目录创建 `.mcp.json` 文件：

```json
{
  "mcpServers": {
    "siyuan": {
      "command": "npx",
      "args": ["-y", "@uminotou/siyuan-mcp-server"],
      "env": {
        "SIYUAN_TOKEN": "your-api-token"
      }
    }
  }
}
```

**第二步：** 在项目 `.claude/settings.local.json` 中启用该 MCP 服务器：

```json
{
  "enabledMcpjsonServers": ["siyuan"]
}
```

**第三步：** 重启 Claude Code，在对话中输入 `/mcp` 验证是否出现 `siyuan` 服务器。

> 如果需要在所有项目中使用，将 `.mcp.json` 放到用户目录 `~/.mcp.json`，并在 `~/.claude/settings.json` 中添加 `enabledMcpjsonServers`。

#### 在 Claude Desktop 中配置

在 Claude Desktop 配置文件中添加以下内容：

```json
{
  "mcpServers": {
    "siyuan": {
      "command": "npx",
      "args": ["-y", "@uminotou/siyuan-mcp-server"],
      "env": {
        "SIYUAN_TOKEN": "your-api-token"
      }
    }
  }
}
```

**配置文件位置：**

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

#### 命令行直接使用

```bash
# 全局安装后直接使用
SIYUAN_TOKEN=your-token siyuan-mcp-server

# 使用 npx（无需安装）
SIYUAN_TOKEN=your-token npx @uminotou/siyuan-mcp-server

# Docker 运行
docker run --rm -i \
  -e SIYUAN_TOKEN=your-token \
  UminoTou/siyuan-mcp-server
```

## 📚 功能与使用

### 🔧 可用工具

本 MCP 服务器提供以下核心功能：

| 功能类别          | 描述                     | 主要命令     |
| ----------------- | ------------------------ | ------------ |
| 📓 **笔记本管理** | 创建、删除、重命名笔记本 | `notebook.*` |
| 📄 **文档操作**   | 创建、编辑、删除文档     | `filetree.*` |
| 🧱 **块级操作**   | 插入、更新、删除内容块   | `block.*`    |
| 🔍 **搜索功能**   | 全文搜索、SQL 查询       | `search.*`   |
| 📋 **模板系统**   | 模板创建和渲染           | `template.*` |
| 📊 **数据查询**   | 复杂数据库查询           | `sql.*`      |

### 💡 使用示例

#### 1. 创建新笔记本
在思源中创建一个名为"AI 学习笔记"的新笔记本。

```json
{
	"type": "executeCommand",
	"params": {
		"type": "notebook.createNotebook",
		"params": {
			"name": "AI 学习笔记"
		}
	}
}
```

#### 2. 全文搜索内容
在所有笔记中按关键词"机器学习"全文检索，返回匹配的文档块及其位置。

```json
{
	"type": "executeCommand",
	"params": {
		"type": "search.fullTextSearch",
		"params": {
			"query": "机器学习",
			"method": 0
		}
	}
}
```

#### 3. 创建带内容的文档
在指定笔记本中创建 Markdown 文档，一次性写入标题和正文内容。

```json
{
	"type": "executeCommand",
	"params": {
		"type": "filetree.createDocWithMd",
		"params": {
			"notebook": "notebook-id",
			"path": "/今日学习总结",
			"markdown": "# 今日学习总结\n\n## 主要收获\n\n1. 学习了...\n2. 理解了..."
		}
	}
}
```

### 🆘 获取帮助

获取特定命令的详细帮助信息。返回命令的参数说明、返回值格式和使用示例。

```json
{
	"type": "help",
	"params": {
		"type": "notebook.createNotebook"
	}
}
```

## 🔧 开发指南

### 本地开发环境搭建

```bash
# 克隆项目
git clone https://github.com/UminoTou/siyuan-mcp-server.git
cd siyuan-mcp-server

# 安装依赖
pnpm install

# 开发模式启动
SIYUAN_TOKEN=your-token pnpm dev

# 构建生产版本
pnpm build

# 运行测试
pnpm test
```

### 项目结构

```
siyuan-mcp-server/
├── dist/                  # 构建输出
│   └── server.js          # 服务器入口
├── src/                   # 源代码
│   └── server.ts          # 主服务入口
├── package.json
└── README.md
```

### 启动验证

成功启动后应看到类似输出：

```
🚀 启动思源笔记 MCP 服务器...
✅ 环境变量检查通过
🎉 MCP 服务器启动成功!
📡 等待客户端连接...
```

### 技术栈与要求

- **运行时**: Node.js >= 18.0.0
- **语言**: TypeScript >= 5.0.0
- **包管理**: pnpm（推荐）或 npm
- **框架**: @modelcontextprotocol/sdk
- **构建工具**: TypeScript Compiler

### Docker 开发

```bash
# 构建开发镜像
docker build -t siyuan-mcp-server:dev .

# 运行开发容器
docker run --rm -it \
  -e SIYUAN_TOKEN=your-token \
  -v $(pwd):/app \
  siyuan-mcp-server:dev
```

## 🐛 问题排查

### 常见问题解答

**❓ 服务器启动失败，提示"缺少 SIYUAN_TOKEN"**

> 请确保正确设置了 `SIYUAN_TOKEN` 环境变量。获取方式：思源笔记 → 设置 → 关于 → API token

**❓ 无法连接到思源笔记**

> 请检查以下几点：
>
> - 思源笔记是否正在运行
> - API 服务是否已开启（默认端口 6806）
> - Token 是否正确且未过期
> - 防火墙是否阻止了连接
> - 如需连接远程思源笔记，请设置 `SIYUAN_API_URL` 环境变量指向正确的地址（例如：`http://your-server-ip:6806`）

**❓ 如何连接远程思源笔记服务**

> 默认情况下，服务器会连接到 `http://localhost:6806`。要连接到远程思源笔记服务，请设置 `SIYUAN_API_URL` 环境变量：
>
> ```bash
> # 连接到远程服务器
> SIYUAN_TOKEN=your-token SIYUAN_API_URL=http://your-server-ip:6806 siyuan-mcp-server
> ```
>
> 或在 Claude Desktop 配置中：
>
> ```json
> {
> 	"mcpServers": {
> 		"siyuan": {
> 			"command": "npx",
> 			"args": ["-y", "@uminotou/siyuan-mcp-server"],
> 			"env": {
> 				"SIYUAN_TOKEN": "your-api-token",
> 				"SIYUAN_API_URL": "http://your-server-ip:6806"
> 			}
> 		}
> 	}
> }
> ```

**❓ Claude Desktop 无法识别 MCP 服务器**

> 请尝试以下解决方案：
>
> - 检查配置文件 JSON 格式是否正确
> - 重启 Claude Desktop 应用
> - 查看 Claude Desktop 日志获取详细错误信息
> - 确认 npx 命令可以正常执行

**❓ macOS / Linux 提示权限不足**

> ```bash
> chmod +x dist/server.js
> ```

**❓ 命令执行失败或返回错误**

> - 确认思源笔记中存在相应的笔记本或文档
> - 检查 Token 权限是否足够
> - 查看服务器日志获取详细错误信息

### 调试模式

启用详细的调试日志：

```bash
DEBUG=siyuan-mcp:* SIYUAN_TOKEN=your-token siyuan-mcp-server
```

### 日志分析

服务器会输出以下类型的日志：

- `INFO`: 一般信息，如服务启动、连接状态
- `WARN`: 警告信息，如参数错误、连接异常
- `ERROR`: 错误信息，如 API 调用失败、认证失败

## 🤝 贡献指南

我们热烈欢迎社区贡献！您可以通过以下方式参与：

### 如何贡献

1. **Fork 项目** - 点击右上角的 Fork 按钮
2. **创建分支** - `git checkout -b feature/awesome-feature`
3. **提交代码** - `git commit -am 'Add awesome feature'`
4. **推送分支** - `git push origin feature/awesome-feature`
5. **创建 PR** - 在 GitHub 上创建 Pull Request

### 开发规范

- **代码风格**: 遵循 TypeScript 严格模式
- **测试覆盖**: 为新功能编写单元测试
- **文档更新**: 更新相关的 API 文档和使用说明
- **提交规范**: 使用清晰的 commit message

### 报告问题

发现 Bug 或有改进建议？请通过以下方式报告：

- [GitHub Issues](https://github.com/UminoTou/siyuan-mcp-server/issues)
- 详细描述问题的复现步骤
- 提供相关的错误日志和环境信息

## 📜 开源协议

本项目采用 ISC 协议开源，详情请查看 [LICENSE](LICENSE) 文件。

## 🔗 相关资源

### 官方链接

- 📚 [思源笔记官网](https://b3log.org/siyuan/)
- 🔗 [Model Context Protocol](https://modelcontextprotocol.io/)
- 🤖 [Claude Desktop](https://claude.ai/download)
- 📦 [npm 包页面](https://www.npmjs.com/package/@uminotou/siyuan-mcp-server)

### 社区与支持

- 💬 [思源笔记社区](https://ld246.com/domain/siyuan)
- 🐙 [项目 GitHub](https://github.com/UminoTou/siyuan-mcp-server)
- 📧 [问题反馈](mailto:huopo@foxmail.com)

## ❤️ 特别感谢

- 🌟 **原始项目作者** [onigeya](https://github.com/onigeya/siyuan-mcp-server) - 本项目基于其优秀的开源工作进行改进和扩展
- 🙏 [思源笔记](https://github.com/siyuan-note/siyuan) 团队 - 提供优秀的笔记软件
- 🤖 [Anthropic](https://www.anthropic.com/) - 推动 MCP 协议发展
- 👥 所有贡献者和用户 - 让项目变得更好

---

<div align="center">
  
  **🌟 如果这个项目对您有帮助，请给我们一个 Star！**
  
  <strong>💻 用 TypeScript 和 ❤️ 精心构建</strong>
  
</div>
