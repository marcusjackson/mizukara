/**
 * Tests for BaseFileInput component
 *
 * TDD tests for file upload with preview and validation.
 * Note: jsdom has limitations with File API (arrayBuffer) and DragEvent,
 * so file upload is tested via modelValue prop and E2E tests cover the rest.
 */

import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import BaseFileInput from './BaseFileInput.vue'

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = vi.fn()
const mockRevokeObjectURL = vi.fn()

describe('BaseFileInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateObjectURL.mockReturnValue('blob:test-url')
    globalThis.URL.createObjectURL = mockCreateObjectURL
    globalThis.URL.revokeObjectURL = mockRevokeObjectURL
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('core file input functionality (Task 1.1)', () => {
    it('renders file input with drop zone', () => {
      render(BaseFileInput)

      expect(screen.getByTestId('file-input-drop-zone')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders with label when provided', () => {
      render(BaseFileInput, {
        props: { label: 'Upload Image' }
      })

      expect(screen.getByText('Upload Image')).toBeInTheDocument()
    })

    it('displays preview when modelValue is provided', async () => {
      const testData = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
      ]) // PNG magic bytes

      render(BaseFileInput, {
        props: {
          modelValue: testData
        }
      })

      await waitFor(() => {
        expect(screen.queryByTestId('file-input-preview')).toBeInTheDocument()
      })

      expect(mockCreateObjectURL).toHaveBeenCalled()
    })

    it('revokes previous blob URL when data changes', async () => {
      const data1 = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
      const data2 = new Uint8Array([0xff, 0xd8, 0xff])

      mockCreateObjectURL.mockReturnValueOnce('blob:url1')
      mockCreateObjectURL.mockReturnValueOnce('blob:url2')

      const { rerender } = render(BaseFileInput, {
        props: { modelValue: data1 }
      })

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalledTimes(1)
      })

      await rerender({ modelValue: data2 })

      await waitFor(() => {
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:url1')
        expect(mockCreateObjectURL).toHaveBeenCalledTimes(2)
      })
    })

    it('provides remove button to clear the file', async () => {
      const user = userEvent.setup()
      const onUpdate = vi.fn()

      render(BaseFileInput, {
        props: {
          modelValue: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
          'onUpdate:modelValue': onUpdate
        }
      })

      await waitFor(() => {
        expect(screen.getByTestId('file-input-remove')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('file-input-remove'))

      expect(onUpdate).toHaveBeenCalledWith(null)
    })

    it('shows empty state when no file is uploaded', () => {
      render(BaseFileInput)

      expect(screen.getByText(/drag.*drop|click.*upload/i)).toBeInTheDocument()
    })
  })

  describe('blob URL cleanup (Task 1.1)', () => {
    it('revokes blob URL on unmount', async () => {
      const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
      mockCreateObjectURL.mockReturnValue('blob:cleanup-test')

      const { unmount } = render(BaseFileInput, {
        props: { modelValue: data }
      })

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled()
      })

      unmount()

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:cleanup-test')
    })
  })

  describe('MIME type detection (Task 1.1)', () => {
    it('detects PNG from magic bytes', async () => {
      // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
      const pngData = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
      ])

      render(BaseFileInput, {
        props: { modelValue: pngData }
      })

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled()
      })

      // Check that blob was created with image/png type
      const blobArg = mockCreateObjectURL.mock.calls[0]?.[0] as Blob
      expect(blobArg).toBeInstanceOf(Blob)
      expect(blobArg.type).toBe('image/png')
    })

    it('detects JPEG from magic bytes', async () => {
      // JPEG magic bytes: FF D8 FF
      const jpegData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00])

      render(BaseFileInput, {
        props: { modelValue: jpegData }
      })

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled()
      })

      const blobArg = mockCreateObjectURL.mock.calls[0]?.[0] as Blob
      expect(blobArg).toBeInstanceOf(Blob)
      expect(blobArg.type).toBe('image/jpeg')
    })

    it('detects GIF from magic bytes', async () => {
      // GIF magic bytes: 47 49 46 38
      const gifData = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])

      render(BaseFileInput, {
        props: { modelValue: gifData }
      })

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled()
      })

      const blobArg = mockCreateObjectURL.mock.calls[0]?.[0] as Blob
      expect(blobArg).toBeInstanceOf(Blob)
      expect(blobArg.type).toBe('image/gif')
    })
  })

  describe('validation and accessibility (Task 1.2)', () => {
    it('has accessible file input with correct accept attribute', () => {
      render(BaseFileInput, {
        props: { accept: 'image/gif' }
      })

      const input = screen.getByTestId('file-input-hidden')
      expect(input).toHaveAttribute('accept', 'image/gif')
    })

    it('disables the input when disabled prop is true', () => {
      render(BaseFileInput, {
        props: { disabled: true }
      })

      const input = screen.getByTestId('file-input-hidden')
      expect(input).toBeDisabled()
    })

    it('shows error message when provided via prop', () => {
      render(BaseFileInput, {
        props: { error: 'Invalid file type' }
      })

      expect(screen.getByText('Invalid file type')).toBeInTheDocument()
    })

    it('has a focusable browse button', () => {
      render(BaseFileInput)

      const browseButton = screen.getByRole('button', { name: /browse/i })
      expect(browseButton).toBeInTheDocument()
      // Button should not be disabled
      expect(browseButton).not.toBeDisabled()
    })

    it('has remove button with proper aria-label', async () => {
      render(BaseFileInput, {
        props: {
          modelValue: new Uint8Array([0x89, 0x50, 0x4e, 0x47])
        }
      })

      await waitFor(() => {
        expect(screen.getByTestId('file-input-remove')).toBeInTheDocument()
      })

      const removeButton = screen.getByLabelText('Remove file')
      expect(removeButton).toBeInTheDocument()
    })
  })
})
