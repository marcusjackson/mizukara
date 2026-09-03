/**
 * Tests for AppSettingsSectionDeviceSync component
 *
 * Section component driving the "Sync devices" dialog: role selection,
 * pairing (stubbed — SharedDeviceSyncPairing has its own tests), the sync
 * exchange (via a mocked useDeviceSyncSession), and success/error/retry
 * states.
 */

import { ref } from 'vue'

import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AppSettingsSectionDeviceSync from './AppSettingsSectionDeviceSync.vue'

import type { DeviceSyncSessionPhase } from '@/shared/composables/use-device-sync-session'

const mockSession = {
  error: ref<string | null>(null),
  phase: ref<DeviceSyncSessionPhase>('idle'),
  run: vi.fn<(dataChannel: RTCDataChannel) => Promise<void>>()
}

vi.mock('@/shared/composables/use-device-sync-session', () => ({
  useDeviceSyncSession: () => mockSession
}))

// A minimal stand-in for the real (separately tested) pairing component:
// exposes its role prop for assertions, a `close()` method matching the
// real component's `defineExpose`, and a button that simulates the
// `paired` event a real pairing flow would eventually emit.
const mockPairingClose = vi.fn()
const SharedDeviceSyncPairingStub = {
  props: ['role'],
  emits: ['paired'],
  methods: { close: mockPairingClose },
  template:
    '<div data-testid="pairing-stub">' +
    '{{ role }}' +
    '<button @click="$emit(\'paired\', {})">Simulate paired</button>' +
    '</div>'
}

function mountSection() {
  return render(AppSettingsSectionDeviceSync, {
    global: {
      stubs: { SharedDeviceSyncPairing: SharedDeviceSyncPairingStub }
    }
  })
}

async function openDialogAndPickRole(
  user: ReturnType<typeof userEvent.setup>,
  label: string
): Promise<void> {
  await user.click(screen.getByRole('button', { name: 'Sync devices' }))
  await user.click(screen.getByRole('button', { name: label }))
}

describe('AppSettingsSectionDeviceSync', () => {
  beforeEach(() => {
    mockSession.phase.value = 'idle'
    mockSession.error.value = null
    mockSession.run.mockClear().mockResolvedValue(undefined)
    mockPairingClose.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders section title and entry point', () => {
    mountSection()

    expect(
      screen.getByRole('heading', { name: 'Sync devices' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Sync devices' })
    ).toBeInTheDocument()
  })

  it('has accessible section semantics', () => {
    mountSection()

    const section = screen.getByLabelText('Device sync settings')
    expect(section.tagName.toLowerCase()).toBe('section')
  })

  it('shows role-selection buttons when the dialog opens', async () => {
    const user = userEvent.setup()
    mountSection()

    await user.click(screen.getByRole('button', { name: 'Sync devices' }))

    expect(
      screen.getByRole('button', { name: 'Show a code' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Scan or enter a code' })
    ).toBeInTheDocument()
  })

  it('shows the pairing flow as initiator after picking "Show a code"', async () => {
    const user = userEvent.setup()
    mountSection()

    await openDialogAndPickRole(user, 'Show a code')

    expect(screen.getByTestId('pairing-stub')).toHaveTextContent('initiator')
  })

  it('shows the pairing flow as responder after picking "Scan or enter a code"', async () => {
    const user = userEvent.setup()
    mountSection()

    await openDialogAndPickRole(user, 'Scan or enter a code')

    expect(screen.getByTestId('pairing-stub')).toHaveTextContent('responder')
  })

  it('runs the sync session once pairing emits paired, and shows success', async () => {
    mockSession.run.mockImplementation(() => {
      mockSession.phase.value = 'complete'
      return Promise.resolve()
    })
    const user = userEvent.setup()
    mountSection()
    await openDialogAndPickRole(user, 'Show a code')

    await user.click(screen.getByRole('button', { name: 'Simulate paired' }))

    expect(mockSession.run).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Devices synced.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()
  })

  it('keeps the pairing component mounted through syncing and completion instead of unmounting it early', async () => {
    // Unmounting SharedDeviceSyncPairing closes its RTCPeerConnection (via
    // usePeerConnection's onScopeDispose) — if the section swapped it out
    // for a spinner the instant `paired` fired, the connection would close
    // before the sync session got to use its data channel. Staying mounted
    // (just visually hidden) through 'syncing' and 'complete' is what keeps
    // the channel alive for `session.run` to actually send/receive over.
    mockSession.run.mockImplementation(() => {
      mockSession.phase.value = 'complete'
      return Promise.resolve()
    })
    const user = userEvent.setup()
    mountSection()
    await openDialogAndPickRole(user, 'Show a code')

    await user.click(screen.getByRole('button', { name: 'Simulate paired' }))

    expect(screen.getByTestId('pairing-stub')).toBeInTheDocument()
  })

  it('closes the underlying connection once the sync session finishes', async () => {
    mockSession.run.mockImplementation(() => {
      mockSession.phase.value = 'complete'
      return Promise.resolve()
    })
    const user = userEvent.setup()
    mountSection()
    await openDialogAndPickRole(user, 'Show a code')

    expect(mockPairingClose).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Simulate paired' }))

    expect(mockPairingClose).toHaveBeenCalledTimes(1)
  })

  it('reloads the page when Done is clicked after a successful sync', async () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { reload })
    mockSession.run.mockImplementation(() => {
      mockSession.phase.value = 'complete'
      return Promise.resolve()
    })
    const user = userEvent.setup()
    mountSection()
    await openDialogAndPickRole(user, 'Show a code')
    await user.click(screen.getByRole('button', { name: 'Simulate paired' }))

    await user.click(screen.getByRole('button', { name: 'Done' }))

    expect(reload).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it('shows an error and a retry button when the sync session fails', async () => {
    mockSession.run.mockImplementation(() => {
      mockSession.phase.value = 'error'
      mockSession.error.value = 'Connection closed before sync finished'
      return Promise.resolve()
    })
    const user = userEvent.setup()
    mountSection()
    await openDialogAndPickRole(user, 'Show a code')

    await user.click(screen.getByRole('button', { name: 'Simulate paired' }))

    expect(
      screen.getByText('Connection closed before sync finished')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Try again' })
    ).toBeInTheDocument()
  })

  it('returns to role-select and remounts pairing when Try again is clicked', async () => {
    mockSession.run.mockImplementation(() => {
      mockSession.phase.value = 'error'
      mockSession.error.value = 'Connection failed'
      return Promise.resolve()
    })
    const user = userEvent.setup()
    mountSection()
    await openDialogAndPickRole(user, 'Show a code')
    await user.click(screen.getByRole('button', { name: 'Simulate paired' }))

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(
      screen.getByRole('button', { name: 'Show a code' })
    ).toBeInTheDocument()
    expect(screen.queryByTestId('pairing-stub')).not.toBeInTheDocument()
  })

  it('resets to role-select when the dialog is closed and reopened', async () => {
    const user = userEvent.setup()
    mountSection()

    await openDialogAndPickRole(user, 'Show a code')
    expect(screen.getByTestId('pairing-stub')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close' }))
    await user.click(screen.getByRole('button', { name: 'Sync devices' }))

    expect(
      screen.getByRole('button', { name: 'Show a code' })
    ).toBeInTheDocument()
  })
})
