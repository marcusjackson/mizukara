import { render, screen, waitFor } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'

import SharedDeviceSyncQrDisplay from './SharedDeviceSyncQrDisplay.vue'

// QR generation is asynchronous and slow under full-suite coverage; the 1000 ms default flakes there.
const QR_WAIT = { timeout: 5000 }

describe('SharedDeviceSyncQrDisplay', () => {
  it('shows a loading spinner before the QR code is ready', () => {
    render(SharedDeviceSyncQrDisplay, { props: { value: 'abc123' } })

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders the QR code as an accessible image once generated', async () => {
    render(SharedDeviceSyncQrDisplay, {
      props: { label: 'Offer code', value: 'abc123' }
    })

    const image = await screen.findByRole(
      'img',
      { name: 'Offer code' },
      QR_WAIT
    )
    expect(image).toHaveAttribute('src', expect.stringMatching(/^data:image/))
  })

  it('regenerates the QR code when the value prop changes', async () => {
    const { getByRole, rerender } = render(SharedDeviceSyncQrDisplay, {
      props: { value: 'first-code' }
    })
    const firstSrc = await waitFor(() => {
      const image = getByRole('img')
      expect(image).toHaveAttribute('src')
      return image.getAttribute('src')
    }, QR_WAIT)

    await rerender({ value: 'a-completely-different-second-code' })

    await waitFor(() => {
      expect(getByRole('img').getAttribute('src')).not.toBe(firstSrc)
    }, QR_WAIT)
  })

  it('shows an error message when QR generation fails', async () => {
    // An oversized value exceeds QR code capacity and makes the `qrcode`
    // library reject instead of resolving a data URL.
    const oversizedValue = 'x'.repeat(10_000)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {
      // Vue logs the unhandled watch-callback rejection; suppress the noise.
    })

    render(SharedDeviceSyncQrDisplay, { props: { value: oversizedValue } })

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    consoleError.mockRestore()
  })
})
