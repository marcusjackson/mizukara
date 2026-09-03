import { markRaw, readonly, ref, shallowRef } from 'vue'

import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import SharedDeviceSyncPairing from './SharedDeviceSyncPairing.vue'

import type { DeviceSyncPairingPhase } from '@/shared/composables/use-device-sync-pairing'

const mockPairing = {
  close: vi.fn(),
  code: ref<string | null>(null),
  dataChannel: shallowRef<RTCDataChannel | null>(null),
  error: ref<string | null>(null),
  phase: ref<DeviceSyncPairingPhase>('idle'),
  start: vi.fn().mockResolvedValue(undefined),
  submitCode: vi.fn().mockResolvedValue(undefined)
}

vi.mock('@/shared/composables/use-device-sync-pairing', () => ({
  useDeviceSyncPairing: () => ({
    close: mockPairing.close,
    code: readonly(mockPairing.code),
    dataChannel: readonly(mockPairing.dataChannel),
    error: readonly(mockPairing.error),
    phase: readonly(mockPairing.phase),
    start: mockPairing.start,
    submitCode: mockPairing.submitCode
  })
}))

describe('SharedDeviceSyncPairing', () => {
  beforeEach(() => {
    mockPairing.phase.value = 'idle'
    mockPairing.code.value = null
    mockPairing.error.value = null
    mockPairing.dataChannel.value = null
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockRejectedValue(new Error('no camera'))
      }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('starts pairing on mount for the initiator', () => {
    render(SharedDeviceSyncPairing, { props: { role: 'initiator' } })

    expect(mockPairing.start).toHaveBeenCalled()
  })

  it('does not start pairing on mount for the responder', () => {
    render(SharedDeviceSyncPairing, { props: { role: 'responder' } })

    expect(mockPairing.start).not.toHaveBeenCalled()
  })

  it('shows a preparing spinner while idle', () => {
    render(SharedDeviceSyncPairing, { props: { role: 'initiator' } })

    expect(screen.getByRole('status')).toHaveAccessibleName('Preparing…')
  })

  it('shows only the scanner while the responder awaits an offer', () => {
    mockPairing.phase.value = 'awaiting-offer'
    render(SharedDeviceSyncPairing, { props: { role: 'responder' } })

    expect(screen.getByText(/use a code instead/i)).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('shows both the offer code and the scanner while the initiator shares its offer', async () => {
    mockPairing.phase.value = 'sharing-offer'
    mockPairing.code.value = 'offer-code'
    render(SharedDeviceSyncPairing, { props: { role: 'initiator' } })

    expect(
      await screen.findByRole('img', { name: 'Device pairing code' })
    ).toBeInTheDocument()
  })

  it('shows only the answer code once the responder has shared it', () => {
    mockPairing.phase.value = 'sharing-answer'
    mockPairing.code.value = 'answer-code'
    render(SharedDeviceSyncPairing, { props: { role: 'responder' } })

    expect(screen.getByText(/use a code instead/i)).toBeInTheDocument()
  })

  it('switches to the copy-paste fallback and submits a pasted code', async () => {
    mockPairing.phase.value = 'awaiting-offer'
    const user = userEvent.setup()
    render(SharedDeviceSyncPairing, { props: { role: 'responder' } })

    await user.click(screen.getByText(/use a code instead/i))
    await user.type(
      screen.getByLabelText("Paste the other device's code"),
      'their-offer'
    )
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(mockPairing.submitCode).toHaveBeenCalledWith('their-offer')
  })

  it('shows a connecting spinner', () => {
    mockPairing.phase.value = 'connecting'
    render(SharedDeviceSyncPairing, { props: { role: 'initiator' } })

    expect(screen.getByRole('status')).toHaveAccessibleName('Connecting…')
  })

  it('shows a paired confirmation and emits paired with the data channel', async () => {
    const channel = markRaw({} as RTCDataChannel)
    mockPairing.dataChannel.value = channel
    const { emitted } = render(SharedDeviceSyncPairing, {
      props: { role: 'initiator' }
    })

    mockPairing.phase.value = 'connected'

    await waitFor(() => {
      expect(screen.getByText('Devices paired.')).toBeInTheDocument()
    })
    expect(emitted()['paired']).toEqual([[channel]])
  })

  it('emits paired once the data channel arrives, even if it arrives after phase is already connected', async () => {
    const { emitted } = render(SharedDeviceSyncPairing, {
      props: { role: 'responder' }
    })

    // connectionState reaching 'connected' and the 'datachannel' event are
    // independently timed — this simulates phase flipping first.
    mockPairing.phase.value = 'connected'
    await waitFor(() => {
      expect(screen.getByText('Devices paired.')).toBeInTheDocument()
    })
    expect(emitted()['paired']).toBeUndefined()

    const channel = markRaw({} as RTCDataChannel)
    mockPairing.dataChannel.value = channel

    await waitFor(() => {
      expect(emitted()['paired']).toEqual([[channel]])
    })
  })

  it('shows the error message', () => {
    mockPairing.phase.value = 'error'
    mockPairing.error.value = 'Connection failed'
    render(SharedDeviceSyncPairing, { props: { role: 'initiator' } })

    expect(screen.getByRole('alert')).toHaveTextContent('Connection failed')
  })
})
