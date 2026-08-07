/**
 * Projects / Certificates / Publications 统一数据文件
 * 首页 Website List 和 /projects 页面共用此数据源，避免两份维护不同步。
 *
 * 新增项目 → 在此处加一条 → 两边自动同步。
 */

// ===== 主语言圆点色板（GitHub 官方语言色近似值） =====
export const LANG_DOT = {
  vue: '#41b883',
  ts: '#3178c6',
  astro: '#ff5d01',
  js: '#f1e05a',
  python: '#3572A5',
  jupyter: '#DA5B0B',
  tailwind: '#06b6d4',
  gis: '#10b981',
  vite: '#646cff'
} as const

// ===== Project 数据类型（对应 ProjectCard Props） =====
export interface ProjectData {
  href: string
  namespace?: string
  title: string
  description: string
  primaryLang: { text: string; dotColor?: string }
  stars?: number | string
  forks?: number | string
  license?: string | false
  accent?: string
  deco?: string
  actionIcon?: string

  /** 首页 WebListCard 额外字段（projects 页面不用） */
  decoImg: string
  imgBg: string
  imgTone: string
  /** 首页 WebListCard 标签（projects 页面用 primaryLang 展示） */
  tags: { text: string; color: 'purple' | 'aqua' | 'green' | 'orange' | 'blue' | 'pink' | 'red' | 'yellow' }[]
}

// ===== Certificate 数据类型（对应 CertificateCard Props） =====
export interface CertificateData {
  href: string
  issuer: string
  title: string
  description: string
  year: number
  validity?: string
  certType?: { text: string; dotColor?: string }
  category: { text: string; dotColor?: string }
  accent?: string
  deco?: string
  actionIcon?: string
}

// ===== Publication 数据类型（对应 PublicationCard Props） =====
export interface PublicationData {
  href: string
  firstAuthor: string
  coAuthorCount?: number
  authors?: string[]
  title: string
  description: string
  year: number
  citations?: number | string
  accessLabel?: string
  venue: { text: string; dotColor?: string }
  field?: { text: string; dotColor?: string }
  authorSeparator?: string
  accent?: string
  deco?: string
  actionIcon?: string
}

// ===== 项目列表（三个项目：ParrotSoundReVue / BlogAstroPure / GeoFrontend2.0） =====
export const PROJECTS: ProjectData[] = [
  {
    href: 'https://github.com/Wanfeng1028/ParrotSoundReVue',
    namespace: 'Wanfeng1028',
    title: 'ParrotSoundReVue',
    description: '基于 Vue 的智能语音识别应用，曾获一个奖项。',
    primaryLang: { text: 'Vue', dotColor: LANG_DOT.vue },
    stars: 56,
    forks: 16,
    license: 'MIT',
    accent: '#0969da',
    deco: '🦜',
    actionIcon: '🐙',

    decoImg: '/images/social-card.png',
    imgBg: 'linear-gradient(135deg, #e0e7ff 0%, #818cf8 55%, #4f46e5 100%)',
    imgTone: '#6366f1',
    tags: [
      { text: 'GitHub', color: 'purple' },
      { text: 'Vue', color: 'aqua' },
      { text: '语音识别', color: 'green' }
    ]
  },
  {
    href: 'https://github.com/Wanfeng1028/BlogAstroPure',
    namespace: 'Wanfeng1028',
    title: 'BlogAstroPure',
    description: '基于 Astro 的个人博客，当前本站。',
    primaryLang: { text: 'Astro', dotColor: LANG_DOT.astro },
    stars: 0,
    forks: 0,
    license: 'MIT',
    accent: '#f97316',
    deco: '📝',
    actionIcon: '🐙',

    decoImg: '/images/touxiang.png',
    imgBg: 'linear-gradient(135deg, #ffedd5 0%, #fb923c 55%, #ea580c 100%)',
    imgTone: '#f97316',
    tags: [
      { text: 'GitHub', color: 'purple' },
      { text: 'Astro', color: 'aqua' },
      { text: 'TypeScript', color: 'green' }
    ]
  }
]

// ===== 证书列表（来自 about 页面的两个浙江省政府奖学金，均用英文展示） =====
export const CERTIFICATES: CertificateData[] = [
  {
    href: '#',
    issuer: 'Zhejiang Provincial Government',
    title: 'Zhejiang Provincial Government Scholarship',
    description:
      'Awarded for outstanding academic performance during the 2024–2025 academic year. One of the highest provincial-level scholarships for undergraduate students in Zhejiang.',
    year: 2025,
    validity: 'Academic Year 2024–2025',
    certType: { text: 'Provincial', dotColor: '#d4a72c' },
    category: { text: 'Scholarship', dotColor: '#10b981' },
    accent: '#d4a72c',
    deco: '🏅',
    actionIcon: '🔗'
  },
  {
    href: '#',
    issuer: 'Zhejiang Provincial Government',
    title: 'Zhejiang Provincial Government Scholarship',
    description:
      'Awarded for outstanding academic performance during the 2025–2026 academic year. Recognized consistently among the top students of the cohort.',
    year: 2026,
    validity: 'Academic Year 2025–2026',
    certType: { text: 'Provincial', dotColor: '#d4a72c' },
    category: { text: 'Scholarship', dotColor: '#10b981' },
    accent: '#f59e0b',
    deco: '🎖️',
    actionIcon: '🔗'
  }
]

// ===== 出版物列表（用户暂无发表，保持空数组，页面会自动隐藏筛选计数为 0） =====
export const PUBLICATIONS: PublicationData[] = []
