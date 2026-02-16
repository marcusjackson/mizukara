/**
 * Tests for useToast composable
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('useToast', () => {
  // Reset modules before each test to reset singleton state
  beforeEach(() => {
    vi.resetModules()
  })

  it('starts with empty toasts', async () => {
    const { useToast } = await import('./use-toast')
    const { toasts } = useToast()

    expect(toasts.value).toHaveLength(0)
  })

  it('adds toast with addToast', async () => {
    const { useToast } = await import('./use-toast')
    const { addToast, toasts } = useToast()

    addToast({ message: 'Test message' })

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]?.message).toBe('Test message')
  })

  it('adds toast with default type info', async () => {
    const { useToast } = await import('./use-toast')
    const { addToast, toasts } = useToast()

    addToast({ message: 'Test' })

    expect(toasts.value[0]?.type).toBe('info')
  })

  it('adds toast with specified type', async () => {
    const { useToast } = await import('./use-toast')
    const { addToast, toasts } = useToast()

    addToast({ message: 'Test', type: 'error' })

    expect(toasts.value[0]?.type).toBe('error')
  })

  it('adds toast with title', async () => {
    const { useToast } = await import('./use-toast')
    const { addToast, toasts } = useToast()

    addToast({ message: 'Message', title: 'Title' })

    expect(toasts.value[0]?.title).toBe('Title')
  })

  it('removes toast by id', async () => {
    const { useToast } = await import('./use-toast')
    const { addToast, removeToast, toasts } = useToast()

    const id = addToast({ message: 'Test' })
    expect(toasts.value).toHaveLength(1)

    removeToast(id)
    expect(toasts.value).toHaveLength(0)
  })

  it('success helper creates success toast', async () => {
    const { useToast } = await import('./use-toast')
    const { success, toasts } = useToast()

    success('Success message')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]?.type).toBe('success')
    expect(toasts.value[0]?.message).toBe('Success message')
  })

  it('error helper creates error toast', async () => {
    const { useToast } = await import('./use-toast')
    const { error, toasts } = useToast()

    error('Error message')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]?.type).toBe('error')
    expect(toasts.value[0]?.message).toBe('Error message')
  })

  it('info helper creates info toast', async () => {
    const { useToast } = await import('./use-toast')
    const { info, toasts } = useToast()

    info('Info message')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]?.type).toBe('info')
  })

  it('warning helper creates warning toast', async () => {
    const { useToast } = await import('./use-toast')
    const { toasts, warning } = useToast()

    warning('Warning message')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]?.type).toBe('warning')
  })

  it('success helper accepts optional title', async () => {
    const { useToast } = await import('./use-toast')
    const { success, toasts } = useToast()

    success('Message', 'Success Title')

    expect(toasts.value[0]?.title).toBe('Success Title')
  })

  it('generates unique toast ids', async () => {
    const { useToast } = await import('./use-toast')
    const { addToast, toasts } = useToast()

    addToast({ message: 'First' })
    addToast({ message: 'Second' })

    expect(toasts.value[0]?.id).not.toBe(toasts.value[1]?.id)
  })

  it('sets default duration', async () => {
    const { useToast } = await import('./use-toast')
    const { addToast, toasts } = useToast()

    addToast({ message: 'Test' })

    expect(toasts.value[0]?.duration).toBe(2000)
  })

  it('allows custom duration', async () => {
    const { useToast } = await import('./use-toast')
    const { addToast, toasts } = useToast()

    addToast({ duration: 10000, message: 'Test' })

    expect(toasts.value[0]?.duration).toBe(10000)
  })
})
