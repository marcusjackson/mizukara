import { createRouter, createWebHistory } from 'vue-router'

import { ROUTES } from './routes'

import type { RouteRecordRaw } from 'vue-router'

/**
 * New UI routes - empty until we start building new pages
 * Default path (/) redirects to refactored kanji list
 */
const newRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/HomePage.vue'),
    meta: { title: 'Home' }
  },
  {
    path: '/entries/:date?',
    name: 'entry-day-view',
    component: () => import('@/pages/EntryDayPage.vue'),
    meta: { title: 'Day View' }
  },
  {
    path: ROUTES.SETTINGS,
    name: 'settings',
    component: () => import('@/pages/SettingsPage.vue'),
    meta: { title: 'Settings' }
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

const routes = [...newRoutes, ...fallbackRoutes]

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

// Update document title on navigation
router.afterEach((to) => {
  const baseTitle = 'Kiroku'
  const pageTitle = to.meta['title'] as string | undefined
  document.title = pageTitle ? `${pageTitle} | ${baseTitle}` : baseTitle
})

export default router
