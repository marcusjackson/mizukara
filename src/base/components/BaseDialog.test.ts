/**
 * Tests for BaseDialog component
 *
 * Note: Reka UI Dialog uses teleport/portal which has limitations in jsdom.
 * These tests verify the component's structure and props but full rendering
 * is tested via E2E tests.
 */

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import BaseDialog from './BaseDialog.vue'

describe('BaseDialog', () => {
  // Mount with stubs to avoid portal issues
  function mountDialog(
    props: { open?: boolean; title?: string; description?: string } = {},
    slots: Record<string, string> = {}
  ) {
    return mount(BaseDialog, {
      props: { open: true, ...props },
      slots,
      global: {
        stubs: {
          // Stub reka-ui components to render inline
          DialogRoot: { template: '<div><slot /></div>' },
          DialogPortal: {
            template: '<div data-testid="portal"><slot /></div>'
          },
          DialogOverlay: { template: '<div class="overlay" />' },
          DialogContent: {
            template: '<div role="dialog" aria-modal="true"><slot /></div>'
          },
          DialogTitle: { template: '<h2><slot /></h2>' },
          DialogDescription: { template: '<p><slot /></p>' },
          DialogClose: {
            template: '<button aria-label="Close"><slot /></button>'
          }
        }
      }
    })
  }

  it('renders dialog structure', () => {
    const wrapper = mountDialog({ title: 'Test Dialog' })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('renders title', () => {
    const wrapper = mountDialog({ title: 'Confirm Action' })
    expect(wrapper.find('h2').text()).toBe('Confirm Action')
  })

  it('renders description', () => {
    const wrapper = mountDialog({
      title: 'Dialog',
      description: 'Are you sure you want to proceed?'
    })
    expect(wrapper.find('p').text()).toBe('Are you sure you want to proceed?')
  })

  it('renders slot content', () => {
    const wrapper = mountDialog(
      { title: 'Dialog' },
      { default: '<div class="custom-content">Body</div>' }
    )
    expect(wrapper.find('.custom-content').exists()).toBe(true)
  })

  it('renders close button with accessible label', () => {
    const wrapper = mountDialog({ title: 'Dialog' })
    const closeButton = wrapper.find('[aria-label="Close"]')
    expect(closeButton.exists()).toBe(true)
  })

  it('renders footer slot', () => {
    const wrapper = mountDialog(
      { title: 'Dialog' },
      { footer: '<button class="footer-btn">Confirm</button>' }
    )
    expect(wrapper.find('.footer-btn').exists()).toBe(true)
  })

  it('supports v-model for open state', async () => {
    const wrapper = mount(BaseDialog, {
      props: {
        open: false,
        'onUpdate:open': (e: boolean) => wrapper.setProps({ open: e })
      },
      global: {
        stubs: {
          DialogRoot: {
            template:
              '<div @click="$emit(\'update:open\', true)"><slot /></div>',
            emits: ['update:open']
          },
          DialogPortal: { template: '<slot />' },
          DialogOverlay: { template: '<div />' },
          DialogContent: { template: '<div><slot /></div>' },
          DialogTitle: { template: '<span />' },
          DialogDescription: { template: '<span />' },
          DialogClose: { template: '<button />' }
        }
      }
    })

    expect(wrapper.props('open')).toBe(false)
    await wrapper.trigger('click')
    expect(wrapper.props('open')).toBe(true)
  })
})
