# siyuan-mcp-server

## Git 提交信息规范

生成 git message 时采用**总分结构**：第一行总结，空行后逐条列出变更。

```
<type>: 一句话总结

- 具体变更点 1
- 具体变更点 2
- ...
```

示例：
```
fix: search.fullTextSearch 端点错误和 MCP 序列化失败

- 端点从 /api/search/fullTextSearch 修正为 /api/search/fullTextSearchBlock
- types 参数从数组 ["doc"] 转换为思源 API 期望的对象格式 {document: true}
- 参数名 limit 映射为 pageSize 以匹配思源 API
- 添加非文本块过滤（img/audio/video/widget/iframe），避免污染搜索结果
- createHandler 增加防御性兜底（response?.data ?? response ?? {}），防止 JSON.stringify(undefined) 导致 MCP -32602 序列化错误
```
