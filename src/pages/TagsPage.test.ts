/**
 * Tests for TagsPage
 *
 * Thin page wrapper for the tags route.
 * Delegates all UI to TagsRoot module component.
 */

import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import TagsPage from './TagsPage.vue'

// Mock child components
vi.mock('@/modules/tags/components/TagsRoot.vue', () => ({
  default: {
    name: 'TagsRoot',
    template: '<div data-testid="tags-root">TagsRoot</div>'
  }
}))

vi.mock('@/shared/components', () => ({
  SharedToast: {
    name: 'SharedToast',
    template: '<div data-testid="shared-toast" />'
  }
}))

describe('TagsPage', () => {
  it('renders TagsRoot component', () => {
    const wrapper = mount(TagsPage)

    expect(wrapper.find('[data-testid="tags-root"]').exists()).toBe(true)
  })

  it('renders SharedToast for notifications', () => {
    const wrapper = mount(TagsPage)

    expect(wrapper.find('[data-testid="shared-toast"]').exists()).toBe(true)
  })
})
