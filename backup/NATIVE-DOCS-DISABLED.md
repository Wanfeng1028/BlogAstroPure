# 原生文章/文档界面已停用（2026-10-23）

博客文章页自 2026-10-23 起由 **Starlight** 渲染，网址不变（仍为 /blog/<slug>）：

- 实现方式：Starlight 的 docs 集合直接加载博客源文件（`src/content/blog`），
  用 generateId 给每篇加 `blog/` 前缀，Starlight 便把文章路由到 /blog/ 下。
  文章源文件只有一份，博客列表/归档/标签仍由 blog 集合照常读取。
- 本目录存档的原生实现均已停用、不参与构建：
  - `backup/blog-article-native/[...id].astro`：原生的博客文章页
  - `backup/docs/`、`backup/demo-docs/`：主题自带的原生文档页与示例文档
- 顶栏没有单独的「文档」入口；博客文章本身即由 Starlight 文档界面展示。
