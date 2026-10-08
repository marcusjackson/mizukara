/**
 * Tests for TagsPage
 *
 * Thin page wrapper for the tags route.
 * Delegates all UI to TagsRoot module component.
 */

import { render, screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'

import TagsPage from './TagsPage.vue'

// Mock child components
vi.mock('@/modules/tags/components/TagsRoot.vue', () => ({
  default: {
    name: 'TagsRoot',
    template: '<main aria-label="Tags">TagsRoot</main>'
  }
}))

vi.mock('@/shared/components', () => ({
  SharedToast: {
    name: 'SharedToast',
    template: '<div role="status" aria-label="Notifications"></div>'
  }
}))

describe('TagsPage', () => {
  it('renders TagsRoot component', () => {
    render(TagsPage)

    expect(screen.getByRole('main', { name: /tags/i })).toBeInTheDocument()
  })

  it('renders SharedToast for notifications', () => {
    render(TagsPage)

    expect(
      screen.getByRole('status', { name: /notifications/i })
    ).toBeInTheDocument()
  })
})
