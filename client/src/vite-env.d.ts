/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_COUCHDB_URL: string
  readonly VITE_COUCHDB_USER: string
  readonly VITE_COUCHDB_PASSWORD: string
}
