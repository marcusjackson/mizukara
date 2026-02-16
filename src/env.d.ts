/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Vue SFC modules
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<
    Record<string, unknown>,
    Record<string, unknown>,
    unknown
  >
  export default component
}

// Modules without type declarations
declare module 'eslint-config-prettier'
declare module 'eslint-plugin-sort-destructure-keys'
declare module 'sql.js' {
  export interface Database {
    run(sql: string, params?: unknown[]): Database
    exec(sql: string, params?: unknown[]): QueryExecResult[]
    close(): void
    export(): Uint8Array
  }

  export interface QueryExecResult {
    columns: string[]
    values: unknown[][]
  }

  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database
  }

  export default function initSqlJs(config?: {
    locateFile?: (file: string) => string
  }): Promise<SqlJsStatic>
}

// Environment variables
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global constants defined by Vite
declare const __APP_VERSION__: string
