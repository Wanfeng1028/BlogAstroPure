import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import cloudflare from '@astrojs/cloudflare'
// import vercel from '@astrojs/vercel' // 保留 Vercel 配置，切换到 Cloudflare 时暂不使用
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
 * @astrojs/cloudflare 的 workerd dev 环境不会预编译 SSR 依赖，导致运行时才发现的
 * 依赖触发级联 reload 崩溃（"deps_ssr/chunk-*.js 文件不存在"）。
 * 这里对非 client 环境强制排除 astro-pure 的预构建，并预编译关键依赖，消除冷启动崩溃。
 * 注意：不能用 ssr.external 标记 packages/pure，否则 Vite 的 SSR 模块运行时会跳过
 * 插件管线，导致 astro-pure 注入的 virtual:config 虚拟模块无法解析。
 * 参考 https://github.com/withastro/astro/issues/16248
 */
function optimizeSsrDeps(): Plugin {
  return {
    name: 'optimize-ssr-deps',
    configEnvironment(name) {
      if (name === 'client') return
      return {
        optimizeDeps: {
          exclude: ['astro-pure'],
          include: [
            'astro/errors',
            'astro/zod',
            'astro/assets/fonts/runtime.js',
            'astro/virtual-modules/middleware.js',
            '@astrojs/cloudflare/image-service',
            'ultrahtml',
            'node-html-parser',
            'hast-util-select',
            'unist-util-visit',
            'rehype'
          ]
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
  // Cloudflare（当前部署目标）
  // 开发环境使用本地 sharp 处理图片，避免 /cdn-cgi/image/ 端点本地不可用导致图片加载失败；
  // 生产环境（Cloudflare 部署）启用 Cloudflare 图片服务以获得边缘优化。
  adapter: cloudflare({
    imageService: isDev ? undefined : 'cloudflare'
  }),
  output: 'server',
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
