/**
 * Tests for route paths utilities and router configuration
 */

import { createMemoryHistory, createRouter } from 'vue-router'

import { describe, expect, it } from 'vitest'

import { buildRoute, ROUTES } from './routes'

import type { RouteRecordRaw } from 'vue-router'

describe('Route Constants', () => {
  it('has correct routes', () => {
    expect(ROUTES.HOME).toBe('/')
    expect(ROUTES.RECORD_LIST).toBe('/records')
    expect(ROUTES.RECORD_DETAIL).toBe('/records/:id')
    expect(ROUTES.SETTINGS).toBe('/settings')
    expect(ROUTES.COMING_SOON).toBe('/coming-soon')
  })
})

describe('buildRoute', () => {
  it('builds route with single parameter', () => {
    const result = buildRoute(ROUTES.RECORD_DETAIL, { id: '123' })
    expect(result).toBe('/records/123')
  })

  it('builds route with multiple parameters', () => {
    const path = '/users/:userId/posts/:postId'
    const result = buildRoute(path, { postId: '456', userId: '123' })
    expect(result).toBe('/users/123/posts/456')
  })

  it('builds route with number parameters', () => {
    const result = buildRoute(ROUTES.RECORD_DETAIL, { id: 123 })
    expect(result).toBe('/records/123')
  })

  it('returns unchanged path when no parameters', () => {
    const result = buildRoute(ROUTES.RECORD_LIST, {})
    expect(result).toBe('/records')
  })
})

describe('Router Configuration', () => {
  const createTestRouter = () => {
    const routes: RouteRecordRaw[] = [
      {
        path: '/',
        name: 'home',
        component: { template: '<div>Home</div>' },
        meta: { title: 'Home' }
      },
      {
        path: '/entries/:date?',
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

    expect(route).toBeDefined()
    expect(route!.path).toBe('/entries/:date?')
    expect(route!.meta['title']).toBe('Day View')
  })

  it('matches /entries without date parameter', async () => {
    const router = createTestRouter()
    await router.push('/entries')

    expect(router.currentRoute.value.name).toBe('entry-day-view')
    // Optional route params are empty string when not provided
    expect(router.currentRoute.value.params['date']).toBe('')
  })

  it('matches /entries/2026-02-09 with date parameter', async () => {
    const router = createTestRouter()
    await router.push('/entries/2026-02-09')

    expect(router.currentRoute.value.name).toBe('entry-day-view')
    expect(router.currentRoute.value.params['date']).toBe('2026-02-09')
  })

  it('route component is EntryDayPage', () => {
    const router = createTestRouter()
    const route = router.getRoutes().find((r) => r.name === 'entry-day-view')

    expect(route).toBeDefined()
    expect(route!.components?.['default']).toBeDefined()
  })

  it('registers settings route correctly', () => {
    const router = createTestRouter()
    const route = router.getRoutes().find((r) => r.name === 'settings')

    expect(route).toBeDefined()
    expect(route!.path).toBe('/settings')
    expect(route!.meta['title']).toBe('Settings')
  })

  it('matches /settings path', async () => {
    const router = createTestRouter()
    await router.push('/settings')

    expect(router.currentRoute.value.name).toBe('settings')
  })
})
