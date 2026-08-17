/**
 * Tests for route paths utilities and router configuration
 */

import { createMemoryHistory, createRouter } from 'vue-router'

import { describe, expect, it } from 'vitest'

import { buildEntryDayRoute, buildPageTitle, ROUTES } from './routes'

import type { RouteRecordRaw } from 'vue-router'

describe('Route Constants', () => {
  it('has correct home route', () => {
    expect(ROUTES.HOME).toBe('/')
  })

  it('has correct entry day route', () => {
    expect(ROUTES.ENTRY_DAY).toBe('/entries/:date?')
  })

  it('has correct settings route', () => {
    expect(ROUTES.SETTINGS).toBe('/settings')
  })

  it('has correct tags route', () => {
    expect(ROUTES.TAGS).toBe('/tags')
  })
})

describe('buildEntryDayRoute', () => {
  it('builds entry day route with a date string', () => {
    const result = buildEntryDayRoute('2026-02-10')
    expect(result).toBe('/entries/2026-02-10')
  })

  it('builds entry day route with any date string', () => {
    expect(buildEntryDayRoute('2022-01-01')).toBe('/entries/2022-01-01')
    expect(buildEntryDayRoute('2099-12-31')).toBe('/entries/2099-12-31')
  })
})

describe('Router Configuration', () => {
  const createTestRouter = () => {
    const routes: RouteRecordRaw[] = [
      {
        path: ROUTES.HOME,
        name: 'home',
        component: { template: '<div>Home</div>' },
        meta: { title: 'Home' }
      },
      {
        path: ROUTES.ENTRY_DAY,
        name: 'entry-day-view',
        component: { template: '<div>EntryDay</div>' },
        meta: { title: 'Day View' }
      },
      {
        path: ROUTES.SETTINGS,
        name: 'settings',
        component: { template: '<div>Settings</div>' },
        meta: { title: 'Settings' }
      }
    ]

    return createRouter({
      history: createMemoryHistory(),
      routes
    })
  }

  it('registers entry-day-view route correctly', () => {
    const router = createTestRouter()
    const route = router.getRoutes().find((r) => r.name === 'entry-day-view')

    if (!route)
      throw new Error('entry-day-view route missing from router config')
    expect(route.path).toBe('/entries/:date?')
    expect(route.meta.title).toBe('Day View')
  })

  it('matches /entries without date parameter', async () => {
    const router = createTestRouter()
    await router.push('/entries')

    expect(router.currentRoute.value.name).toBe('entry-day-view')
    // Optional route params are undefined when not provided (vue-router 5;
    // vue-router 4 used an empty string).
    expect(router.currentRoute.value.params['date']).toBeUndefined()
  })

  it('matches /entries/2026-02-09 with date parameter', async () => {
    const router = createTestRouter()
    await router.push('/entries/2026-02-09')

    expect(router.currentRoute.value.name).toBe('entry-day-view')
    expect(router.currentRoute.value.params['date']).toBe('2026-02-09')
  })

  it('matches built entry day route', async () => {
    const router = createTestRouter()
    await router.push(buildEntryDayRoute('2026-02-15'))

    expect(router.currentRoute.value.name).toBe('entry-day-view')
    expect(router.currentRoute.value.params['date']).toBe('2026-02-15')
  })

  it('registers settings route correctly', () => {
    const router = createTestRouter()
    const route = router.getRoutes().find((r) => r.name === 'settings')

    if (!route) throw new Error('settings route missing from router config')
    expect(route.path).toBe('/settings')
    expect(route.meta.title).toBe('Settings')
  })

  it('matches /settings path', async () => {
    const router = createTestRouter()
    await router.push('/settings')

    expect(router.currentRoute.value.name).toBe('settings')
  })
})

describe('buildPageTitle', () => {
  it('returns title with app name when page title provided', () => {
    expect(buildPageTitle('Settings')).toBe('Settings | Mizukara')
  })

  it('returns title with app name for any page name', () => {
    expect(buildPageTitle('Day View')).toBe('Day View | Mizukara')
    expect(buildPageTitle('Home')).toBe('Home | Mizukara')
    expect(buildPageTitle('Not Found')).toBe('Not Found | Mizukara')
  })

  it('returns app name only when page title is undefined', () => {
    expect(buildPageTitle(undefined)).toBe('Mizukara')
  })

  it('returns app name only when page title is empty string', () => {
    expect(buildPageTitle('')).toBe('Mizukara')
  })
})

describe('Document title update on navigation', () => {
  const createTitleRouter = () => {
    const routes: RouteRecordRaw[] = [
      {
        path: ROUTES.HOME,
        name: 'home',
        component: { template: '<div>Home</div>' },
        meta: { title: 'Home' }
      },
      {
        path: ROUTES.ENTRY_DAY,
        name: 'entry-day-view',
        component: { template: '<div>EntryDay</div>' },
        meta: { title: 'Day View' }
      },
      {
        path: ROUTES.SETTINGS,
        name: 'settings',
        component: { template: '<div>Settings</div>' },
        meta: { title: 'Settings' }
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: { template: '<div>Not Found</div>' },
        meta: {}
      }
    ]

    const router = createRouter({
      history: createMemoryHistory(),
      routes
    })

    // Use the real buildPageTitle function (not a re-implementation)
    router.afterEach((to) => {
      document.title = buildPageTitle(to.meta.title)
    })

    return router
  }

  it('sets title with page name for named routes', async () => {
    const router = createTitleRouter()
    await router.push(ROUTES.SETTINGS)

    expect(document.title).toBe('Settings | Mizukara')
  })

  it('sets title with page name for entry day route', async () => {
    const router = createTitleRouter()
    await router.push('/entries/2024-01-15')

    expect(document.title).toBe('Day View | Mizukara')
  })

  it('sets base title only when route has no title meta', async () => {
    const router = createTitleRouter()
    await router.push('/unknown-path')

    expect(document.title).toBe('Mizukara')
  })
})
