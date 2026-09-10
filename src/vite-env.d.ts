/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPC_URL?: string
  readonly VITE_EXPLORER_URL?: string
  readonly VITE_EXPLORER_SUFFIX?: string
  readonly VITE_NETWORK_NAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
