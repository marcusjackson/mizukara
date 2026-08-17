/**
 * Tests for HomePage component
 *
 * Pure redirect component that navigates to /entries on mount.
 * Uses router.replace to avoid history entry.
 */

import { createMemoryHistory, createRouter } from 'vue-router'

import { render, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ROUTES } from '@/router/routes'

import HomePage from './HomePage.vue'

// Mock date utils to return consistent test date
vi.mock('@/shared/utils/date-utils', async () => {
  const actual = await vi.importActual('@/shared/utils/date-utils')
  return {
    ...actual,
    getToday: vi.fn(() => '2026-02-14')
  }
})

describe('HomePage', () => {
  const createTestRouter = () => {
    return createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: ROUTES.HOME,
          name: 'home',
          component: HomePage
        },
        {
          path: ROUTES.ENTRY_DAY,
          name: 'entry-day-view',
          component: { template: '<div>Entry Day View</div>' }
        }
      ]
    })
  }

  let router: ReturnType<typeof createTestRouter>

  beforeEach(() => {
    vi.clearAllMocks()
    router = createTestRouter()
  })

  it('redirects to /entries on mount', async () => {
    await router.push(ROUTES.HOME)
    await router.isReady()

    render(HomePage, {
      global: { plugins: [router] }
    })

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/entries')
    })
  })

  it('uses router.replace (not push) to avoid history entry', async () => {
    const replaceSpy = vi.spyOn(router, 'replace')

    await router.push(ROUTES.HOME)
    await router.isReady()

    render(HomePage, {
      global: { plugins: [router] }
    })

    await waitFor(() => {
      expect(replaceSpy).toHaveBeenCalledWith('/entries')
    })
  })

  it('redirect path is /entries without date parameter', async () => {
    await router.push(ROUTES.HOME)
    await router.isReady()

    render(HomePage, {
      global: { plugins: [router] }
    })

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/entries')
      expect(router.currentRoute.value.name).toBe('entry-day-view')
    })
  })
})
