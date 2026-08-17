import { createRouter, createWebHistory } from 'vue-router'

import { buildPageTitle, ROUTES } from './routes'

import type { RouteRecordRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
  }
}

/**
 * Main application routes
 */
const appRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/HomePage.vue'),
    meta: { title: 'Home' }
  },
  {
    path: ROUTES.ENTRY_DAY,
    name: 'entry-day-view',
    component: () => import('@/pages/EntryDayPage.vue'),
    meta: { title: 'Day View' }
  },
  {
    path: ROUTES.SETTINGS,
    name: 'settings',
    component: () => import('@/pages/SettingsPage.vue'),
    meta: { title: 'Settings' }
  },
  {
    path: ROUTES.TAGS,
    name: 'tags',
    component: () => import('@/pages/TagsPage.vue'),
    meta: { title: 'Tags' }
  }
]

/**
 * Catch-all for not found pages
 */
const fallbackRoutes: RouteRecordRaw[] = [
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFoundPage.vue'),
    meta: { title: 'Not Found' }
  }
]

const routes = [...appRoutes, ...fallbackRoutes]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

/**
 * Updates the document title after each completed navigation.
 * Falls back to the app name when no route-specific title is set.
 */
router.afterEach((to) => {
  document.title = buildPageTitle(to.meta.title)
})

export default router
