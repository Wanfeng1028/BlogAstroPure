# Demo Docs 备份说明

这个目录保存的是从 `src/content/docs/` 移动出来的 Astro-Pure 主题官方默认文档，共 15 篇（setup 4 + integrations 7 + advanced 4 + unocss 1）。

**为什么移动？**
上线后如果保留在 `src/content/docs/`，会自动生成 `/docs/getting-started` 等 URL，并且 sitemap 也会收录这些主题文档内容，导致搜索引擎搜你的域名搜出来一堆 "Astro-Pure 使用教程"，看起来像个主题站点而不是你的个人博客。

**恢复到项目中：**
如果以后需要 Astro-Pure 的参考文档，或者想把 docs 当做你自己写技术文档的起始模板，把对应子目录或文件拷回 `src/content/docs/` 下即可，`content.config.ts` 的 docs collection 会自动扫描。

文件列表（2026-08-08 从 Astro-Pure v4.1.4 默认模板拷贝）：
```
setup/
  ├── configuration.md
  ├── content.mdx
  ├── deployment.mdx
  └── getting-started.mdx
integrations/
  ├── advanced.mdx
  ├── comment.mdx
  ├── components.mdx
  ├── content-present.mdx
  ├── links.mdx
  ├── others.mdx
  └── unocss.md
advanced/
  ├── about.mdx
  ├── customize.mdx
  ├── faq.md
  ├── optimize.mdx
  └── update.mdx
```
