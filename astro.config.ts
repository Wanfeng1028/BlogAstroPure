import { rehypeHeadingIds } from '@astrojs/markdown-remark'
// import cloudflare from '@astrojs/cloudflare' // 纯静态模式不需要适配器
// import vercel from '@astrojs/vercel' // 保留 Vercel 配置，需要时切换
import starlight from '@astrojs/starlight'
import AstroPureIntegration from 'astro-pure'
import { defineConfig, fontProviders, svgoOptimizer } from 'astro/config'
import type { Plugin } from 'vite'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

// Local integrations
import rehypeAutolinkHeadings from './src/plugins/rehype-auto-link-headings.ts'
// Shiki
import {
  addCollapse,
  addCopyButton,
  addLanguage,
  addTitle,
  updateStyle
} from './src/plugins/shiki-custom-transformers.ts'
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerRemoveNotationEscape
} from './src/plugins/shiki-official/transformers.ts'
import config from './src/site.config.ts'

/**
 * @astrojs/cloudflare 的 workerd SSR 环境在首次 render 时容易找不到已被 Vite 跳过的
 * 深层依赖（表现为 "deps_ssr/chunk-*.js 文件不存在"）。这里把非 client 环境的常见
 * 运行时依赖加入 optimizeDeps.include，保证它们被 Vite SSR 预编译打包。
 *
 * 注意：
 * 1) 不能把 `astro-pure` 放进 include（它依赖 virtual:config 虚拟模块，必须走插件管线）；
 * 2) 绝对不能把 `astro/assets/fonts/runtime.js` 放进 include —— 它依赖
 *    `virtual:astro:assets/fonts/internal` 这类 Astro 内部虚拟模块，被 esbuild 强行预编译
 *    时会直接报 "Could not resolve virtual:astro:assets/fonts/internal"。
 *    之前踩过这个坑，build 阶段会崩。
 * 3) @astrojs/cloudflare/image-service 同样是 workerd 专用入口，在本地预构建会引用
 *    不存在的 workerd runtime，应该放到 exclude 或不处理。
 */
function optimizeSsrDeps(): Plugin {
  return {
    name: 'optimize-ssr-deps',
    configEnvironment(name) {
      if (name === 'client') return
      return {
        optimizeDeps: {
          exclude: ['astro-pure', '@astrojs/cloudflare/image-service'],
          include: [
            'astro/errors',
            'astro/zod',
            'astro/virtual-modules/middleware.js',
            'ultrahtml',
            'node-html-parser',
            'hast-util-select',
            'unist-util-visit',
            'rehype'
          ],
          // 抑制 esbuild 的 createRequire(import.meta.url) banner，
          // 避免 Vite SSR 转换重写 import.meta 中的 meta 标识符时与 zod v4 的 meta 导出冲突
          // 参考: https://github.com/withastro/astro/pull/16109
          esbuildOptions: { banner: { js: '' } }
        }
      }
    }
  }
}

// Astro 6 移除了 defineConfig 的函数形式，用 process.argv 检测 dev 模式
const isDev = process.argv.includes('dev')

// https://astro.build/config
export default defineConfig({
  // [Basic]
  site: 'https://gemmae.dev',
  // Deploy to a sub path
  // https://astro-pure.js.org/docs/setup/deployment#platform-with-base-path
  // base: '/astro-pure/',
  trailingSlash: 'never',
  // root: './my-project-directory',
  server: { host: true },
  // https://docs.astro.build/en/guides/prefetch/
  prefetch: {
    // prefetchAll: true,
    defaultStrategy: 'viewport'
  },

  // [Adapter]
  // https://docs.astro.build/en/guides/deploy/
  // 纯静态模式：Cloudflare Pages 直接托管 HTML，不需要 Worker/适配器
  // output: 'static' 是 Astro 默认值，无需显式设置
  // Cloudflare 适配器已移除：SSR Worker 配置复杂且博客不需要动态渲染
  // adapter: cloudflare({ imageService: isDev ? undefined : 'cloudflare' }),
  // output: 'static',
  // Vercel（保留备用，需要时把上面换成这行）
  // adapter: vercel({ imageService: true }),
  // output: 'server',
  // Local (standalone)
  // adapter: node({ mode: 'standalone' }),
  // output: 'server',

  // [Assets]
  image: {
    responsiveStyles: true,
    service: { entrypoint: 'astro/assets/services/sharp' },
    // domains: ['ghchart.rshah.org'],
    remotePatterns: [{ protocol: 'https' }]
  },
  // Enable font preloading and optimization
  // https://docs.astro.build/en/guides/fonts/
  fonts: [
    {
      provider: fontProviders.fontshare(),
      name: 'Satoshi',
      cssVariable: '--font-satoshi',
      // Default included:
      // weights: [400],
      // styles: ["normal", "italics"],
      // subsets: ["cyrillic-ext", "cyrillic", "greek-ext", "greek", "vietnamese", "latin-ext", "latin"],
      // fallbacks: ["sans-serif"],
      styles: ['normal', 'italic'],
      weights: [400, 500],
      subsets: ['latin']
    }
  ],

  // [Markdown]
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      [rehypeKatex, {}],
      rehypeHeadingIds,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: { className: ['anchor'] },
          content: { type: 'text', value: '#' }
        }
      ]
    ],
    // https://docs.astro.build/en/guides/syntax-highlighting/
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      },
      transformers: [
        // Two copies of @shikijs/types (one under node_modules
        // and another nested under @astrojs/markdown-remark → shiki).
        // Official transformers
        // @ts-ignore this happens due to multiple versions of shiki types
        transformerNotationDiff(),
        // @ts-ignore this happens due to multiple versions of shiki types
        transformerNotationHighlight(),
        // @ts-ignore this happens due to multiple versions of shiki types
        transformerRemoveNotationEscape(),
        // Custom transformers
        // @ts-ignore this happens due to multiple versions of shiki types
        updateStyle(),
        // @ts-ignore this happens due to multiple versions of shiki types
        addTitle(),
        // @ts-ignore this happens due to multiple versions of shiki types
        addLanguage(),
        // @ts-ignore this happens due to multiple versions of shiki types
        addCopyButton(2000), // timeout in ms
        // @ts-ignore this happens due to multiple versions of shiki types
        addCollapse(15) // max lines that needs to collapse
      ]
    }
  },

  // [Integrations]
  integrations: [
    // 文档系统：Starlight（2026-10-23 起，原生文档系统已停用）
    // 版本锁定 0.40.0：0.41+ 要求 Astro 7，本站是 Astro 6；升级 Astro 7 后再放开
    // 内容在 src/content/docs/docs/（内层 docs = /docs/ 网址前缀），其余路由仍归 Astro Pure
    starlight({
      title: '晚风文档',
      description: '晚风的文档站 —— 折腾笔记、工具手册与项目文档。',
      favicon: '/favicon/favicon.ico',
      defaultLocale: 'root',
      locales: {
        root: { label: '简体中文', lang: 'zh-CN' }
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/Wanfeng1028/BlogAstroPure' }
      ],
      editLink: {
        baseUrl: 'https://github.com/Wanfeng1028/BlogAstroPure/edit/main/'
      },
      // 博客已有自己的 404 页（src/pages/404.astro），不要让 Starlight 接管
      disable404Route: true,
      sidebar: [
        {
          label: '概览',
          items: [{ label: '文档首页', slug: 'docs' }]
        },
        {
          // 博客即文章：文档侧边栏直接索引博客原文，不另建示例文章
          label: '全部文章',
          items: [
            { label: 'ENVI 打开 Landsat 9 影像', link: '/blog/001-envi-landsat9-open' },
            { label: 'ERA5 全球极大风速分布图', link: '/blog/002-era5-wind-gust-2024' },
            { label: '讯飞 MaaS 免费领 Qwen API', link: '/blog/003-xfyun-maas-qwen-free-api' },
            {
              label: 'OneDrive 内存泄漏排查与禁用',
              link: '/blog/004-windows-onedrive-memory-leak-disable'
            }
          ]
        }
      ]
    }),
    // astro-pure will automatically add sitemap, mdx & unocss
    // sitemap(),
    // mdx(),
    AstroPureIntegration(config)
  ],

  // [Experimental]
  experimental: {
    // Allow compatible editors to support intellisense features for content collection entries
    // https://docs.astro.build/en/reference/experimental-flags/content-intellisense/
    contentIntellisense: true,
    // Enable SVGO optimization for SVG assets
    // https://docs.astro.build/en/reference/experimental-flags/svg-optimization/
    svgOptimizer: svgoOptimizer(),
    // Enables pre-rendering your prefetched pages on the client in supported browsers.
    // https://docs.astro.build/en/reference/experimental-flags/client-prerender/
    clientPrerender: true,
    // https://docs.astro.build/en/reference/experimental-flags/queued-rendering/
    queuedRendering: {
      enabled: true
    }
  },
  vite: {
    plugins: [optimizeSsrDeps()]
  }
})
