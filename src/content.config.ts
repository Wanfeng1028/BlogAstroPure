import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'
import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

function removeDupsAndLowerCase(array: string[]) {
  if (!array.length) return array
  const lowercaseItems = array.map((str) => str.toLowerCase())
  const distinctItems = new Set(lowercaseItems)
  return Array.from(distinctItems)
}

// Define blog collection
const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  // Required
  schema: ({ image }) =>
    z.object({
      // Required — 放宽到真实个人博客常用长度，避免长标题/详细描述被静默丢弃
      title: z.string().max(120),
      description: z.string().max(250),
      publishDate: z.coerce.date(),
      // Optional
      updatedDate: z.coerce.date().optional(),
      heroImage: z
        .object({
          src: image(),
          alt: z.string().optional(),
          inferSize: z.boolean().optional(),
          width: z.number().optional(),
          height: z.number().optional(),

          color: z.string().optional()
        })
        .optional(),
      tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
      category: z.string().optional(),
      language: z.string().optional(),
      draft: z.boolean().default(false),
      // Special fields
      comment: z.boolean().default(true)
    })
})

// Define docs collection — Starlight 托管（2026-10-23 起）
// 原生文档系统（Astro Pure 自带的手写 schema + backup/docs 路由页）已停用，见 backup/NATIVE-DOCS-DISABLED.md
// 内容放在 src/content/docs/docs/ 下：外层 docs 是集合根，内层 docs 是网址的 /docs/ 前缀
const docs = defineCollection({
  loader: docsLoader(),
  schema: docsSchema({
    // 补回旧原生 schema 的字段：astro-pure 的列表工具（server.ts）按集合联合类型读这些字段，
    // 缺了会在 astro check 里多出一串类型错误；Starlight 本身不使用它们
    extend: z.object({
      publishDate: z.coerce.date().optional(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
      comment: z.boolean().default(true)
    })
  })
})

// Define murmurs (碎碎念) collection
const murmurs = defineCollection({
  loader: glob({ base: './src/content/murmurs', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(60),
      description: z.string().max(160),
      publishDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: z
        .object({
          src: image(),
          alt: z.string().optional(),
          inferSize: z.boolean().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
          color: z.string().optional()
        })
        .optional(),
      tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
      category: z.string().optional(),
      language: z.string().optional(),
      draft: z.boolean().default(false),
      comment: z.boolean().default(true)
    })
})

// 已知问题：astro check 会在此行报一个 ts(2883)——docsSchema 的推断类型引用了 Starlight
// 内部 sidebar 类型，在本仓 declaration:true 下不可命名。仅影响类型检查的声明生成，
// 不影响 astro build 构建与运行时（zod 校验）；待 Starlight 或本仓 tsconfig 后续处理
export const collections = { blog, docs, murmurs }
