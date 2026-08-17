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

// Re-declare sql.js with explicitly typed API surface.
// @types/sql.js uses `export =` (CJS-style), which causes SonarQube's
// TypeScript analysis engine to treat imported types as 'error' types.
// This explicit declaration uses ES module syntax so type resolution works
// correctly, while @types/sql.js is kept installed for reference.
declare module 'sql.js' {
  export type SqlValue = number | string | Uint8Array | null
  export type ParamsObject = Record<string, SqlValue>
  export type BindParams = SqlValue[] | ParamsObject | null

  export interface QueryExecResult {
    columns: string[]
    values: SqlValue[][]
  }

  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | null) => Database
  }

  export class Database {
    constructor(data?: ArrayLike<number> | null)
    run(sql: string, params?: BindParams): Database
    exec(sql: string, params?: BindParams): QueryExecResult[]
    close(): void
    export(): Uint8Array
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
