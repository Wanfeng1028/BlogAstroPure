/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly TURNSTILE_SITE_KEY?: string
  readonly TURNSTILE_SECRET_KEY?: string
  readonly RATE_LIMIT_MAX?: string
  readonly RATE_LIMIT_WINDOW_MS?: string
  readonly ENABLE_COMMENT_MODERATION?: string
  readonly MAX_COMMENT_LENGTH?: string
  readonly CONTENT_BLOCKLIST?: string
  readonly SPAM_KEYWORDS?: string
  readonly ALLOWED_COMMENT_LANGS?: string
  readonly ANTI_FRAUD_ENABLED?: string
  readonly SESSION_SECRET?: string
  readonly [key: string]: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
