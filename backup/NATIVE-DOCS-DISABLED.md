# 原生文档系统已停用（2026-10-23）

Astro Pure 主题自带的原生文档系统已于 2026-10-23 正式停用，文档改由
Starlight（@astrojs/starlight）承载，入口为站内 `/docs/`。

停用范围：

- `src/content.config.ts` 中原生的 `docs` 集合定义（手写 zod schema）已移除，
  改为 Starlight 官方的 `docsLoader()` + `docsSchema()`。
- 本目录下的 `docs/`（原生文档路由页：index / [...id] / DocsContents）与
  `demo-docs/`（主题示例文档）仅作历史存档保留，**不参与路由、不参与构建**，
  不要再往里添加内容。
- 新文档一律写到 `src/content/docs/`（Starlight 规范），写作说明见站内
  `/docs/getting-started`。
