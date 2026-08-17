/**
 * Tests for App component
 *
 * Root component that handles database initialization,
 * loading/error states, and bootstraps the application.
 */

import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDatabase } from '@/shared/composables/use-database'

import App from './App.vue'

// Mock database composable
vi.mock('@/shared/composables/use-database', () => ({
  useDatabase: vi.fn()
}))

const createTestRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/:pathMatch(.*)*', component: { template: '<div>page</div>' } }
    ]
  })

const buildMockDatabase = (
  overrides: Partial<ReturnType<typeof useDatabase>> = {}
) => ({
  database: ref(null),
  isInitialized: ref(false),
  isInitializing: ref(false),
  initError: ref<Error | null>(null),
  initialize: vi.fn(),
  persist: vi.fn(),
  exec: vi.fn(),
  run: vi.fn(),
  replaceDatabase: vi.fn(),
  ...overrides
})

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state while database is initializing', () => {
    vi.mocked(useDatabase).mockReturnValue(buildMockDatabase())

    render(App, {
      global: { plugins: [createTestRouter()] }
    })

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('calls initialize() on mount', async () => {
    const initialize = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useDatabase).mockReturnValue(buildMockDatabase({ initialize }))

    render(App, {
      global: { plugins: [createTestRouter()] }
    })

    await waitFor(() => {
      expect(initialize).toHaveBeenCalledOnce()
    })
  })

  it('renders RouterView after database is initialized', async () => {
    vi.mocked(useDatabase).mockReturnValue(
      buildMockDatabase({ isInitialized: ref(true) })
    )

    render(App, {
      global: { plugins: [createTestRouter()] }
    })

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  it('renders error state when database initialization fails', () => {
    const error = new Error('Database failed to open')
    vi.mocked(useDatabase).mockReturnValue(
      buildMockDatabase({ initError: ref(error) })
    )

    render(App, {
      global: { plugins: [createTestRouter()] }
    })

    expect(screen.getByText(/database error/i)).toBeInTheDocument()
    expect(screen.getByText(error.message)).toBeInTheDocument()
  })
})
