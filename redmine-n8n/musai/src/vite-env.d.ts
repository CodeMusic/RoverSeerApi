/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_N8N_WEBHOOK_URL: string
  readonly VITE_N8N_WEBHOOK_USERNAME: string
  readonly VITE_N8N_WEBHOOK_SECRET: string
  readonly VITE_WELCOME_MESSAGE: string
  readonly VITE_SITE_TITLE: string
  readonly VITE_ASSISTANT_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
