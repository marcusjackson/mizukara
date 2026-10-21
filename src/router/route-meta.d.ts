/**
 * Route meta fields the app reads. A declaration file, so the test and e2e type-check projects see it too.
 */
export {};

declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
  }
}
