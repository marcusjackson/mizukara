/**
 * Tests for SharedConfirmDialog component
 *
 * Reusable confirmation dialog for destructive actions.
 * Built on BaseDialog with confirm/cancel button pair.
 *
 * Note: Reka UI Dialog uses teleport/portal which has limitations in jsdom.
 * Tests use @vue/test-utils mount with stubbed Reka UI components.
 */

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SharedConfirmDialog from './SharedConfirmDialog.vue'

const rekaUiStubs = {
  DialogRoot: {
    template: '<div v-if="open"><slot /></div>',
    props: ['open'],
    emits: ['update:open']
  },
  DialogPortal: { template: '<div><slot /></div>' },
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

function mountDialog(
  props: Record<string, unknown> = {},
  options: Record<string, unknown> = {}
) {
  return mount(SharedConfirmDialog, {
    props: {
      open: true,
      title: 'Confirm Action',
      description: 'Are you sure you want to proceed?',
      confirmLabel: 'Confirm',
      ...props
    },
    global: {
      stubs: rekaUiStubs
    },
    ...options
  })
}

describe('SharedConfirmDialog', () => {
  it('renders title and description when open', () => {
    const wrapper = mountDialog()

    expect(wrapper.find('h2').text()).toBe('Confirm Action')
    expect(wrapper.find('p').text()).toBe('Are you sure you want to proceed?')
  })

  it('renders confirm and cancel buttons', () => {
    const wrapper = mountDialog()
    const buttons = wrapper.findAll('button').filter((b) => {
      const label = b.attributes('aria-label')
      return label !== 'Close'
    })

    const texts = buttons.map((b) => b.text())
    expect(texts).toContain('Confirm')
    expect(texts).toContain('Cancel')
  })

  it('emits confirm on confirm button click', async () => {
    const wrapper = mountDialog()
    const confirmButton = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Confirm')

    await confirmButton!.trigger('click')

    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('emits cancel on cancel button click', async () => {
    const wrapper = mountDialog()
    const cancelButton = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Cancel')

    await cancelButton!.trigger('click')

    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('emits update:open with false on cancel', async () => {
    const wrapper = mountDialog()
    const cancelButton = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Cancel')

    await cancelButton!.trigger('click')

    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })

  it('uses custom cancel label', () => {
    const wrapper = mountDialog({ cancelLabel: 'No, go back' })
    const buttons = wrapper.findAll('button')
    const texts = buttons.map((b) => b.text())

    expect(texts).toContain('No, go back')
  })

  it('defaults cancel label to Cancel', () => {
    const wrapper = mountDialog()
    const buttons = wrapper.findAll('button')
    const texts = buttons.map((b) => b.text())

    expect(texts).toContain('Cancel')
  })

  it('applies danger variant to confirm button', () => {
    const wrapper = mountDialog({ variant: 'danger' })
    const confirmButton = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Confirm')

    expect(confirmButton!.classes().join(' ')).toMatch(/danger/)
  })

  it('disables confirm button when loading', () => {
    const wrapper = mountDialog({ loading: true })
    const confirmButton = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Confirm')

    expect(confirmButton!.attributes('disabled')).toBeDefined()
  })

  it('disables cancel button when loading', () => {
    const wrapper = mountDialog({ loading: true })
    const cancelButton = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Cancel')

    expect(cancelButton!.attributes('disabled')).toBeDefined()
  })

  it('does not render dialog content when closed', () => {
    const wrapper = mountDialog({ open: false })

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  describe('accessibility', () => {
    it('adds descriptive aria-label to cancel button', () => {
      const wrapper = mountDialog()
      const cancelButton = wrapper
        .findAll('button')
        .find((b) => b.text() === 'Cancel')

      const ariaLabel = cancelButton!.attributes('aria-label')
      expect(ariaLabel).toContain('Cancel')
    })

    it('adds descriptive aria-label to confirm button for danger variant', () => {
      const wrapper = mountDialog({ variant: 'danger' })
      const confirmButton = wrapper
        .findAll('button')
        .find((b) => b.text() === 'Confirm')

      const ariaLabel = confirmButton!.attributes('aria-label')
      expect(ariaLabel).toContain('destructive')
    })

    it('focus management: cancel button should have ref for danger variant', () => {
      const wrapper = mountDialog({ variant: 'danger' })
      const cancelButton = wrapper
        .findAll('button')
        .find((b) => b.text() === 'Cancel')

      // Verify cancel button exists and can be referenced
      expect(cancelButton!.exists()).toBe(true)
    })
  })
})
