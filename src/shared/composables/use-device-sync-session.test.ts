import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDeviceSyncSession } from './use-device-sync-session'

import type { SyncPayload } from '@/shared/types/device-sync-payload-types'

const mockDatabase: { value: object | null } = { value: {} }

vi.mock('@/shared/composables/use-database', () => ({
  useDatabase: () => ({ database: mockDatabase })
}))

const mockSerialize = vi.fn<() => string>()
const mockApply = vi.fn<(...args: unknown[]) => void>()
const mockParse = vi.fn<(json: string) => SyncPayload>()

vi.mock('@/api/device-sync', () => ({
  applySyncPayload: (...args: unknown[]) => {
    mockApply(...args)
  },
  parseSyncPayloadJSON: (json: string) => mockParse(json),
  serializeDatabaseToJSON: () => mockSerialize()
}))

const mockPersistImmediately = vi
  .fn<() => Promise<void>>()
  .mockResolvedValue(undefined)

vi.mock('@/db/indexeddb', () => ({
  persistImmediately: () => mockPersistImmediately()
}))

class FakeDataChannel extends EventTarget {
  readyState: RTCDataChannelState = 'open'
  bufferedAmount = 0
  bufferedAmountLowThreshold = 0
  readonly sent: Uint8Array[] = []

  send(data: Uint8Array): void {
    this.sent.push(data)
  }

  receive(chunk: Uint8Array): void {
    this.dispatchEvent(
      new MessageEvent('message', { data: chunk.buffer as ArrayBuffer })
    )
  }
}

const EMPTY_PAYLOAD: SyncPayload = { entries: [], tags: [], entry_tags: [] }

function receiveJSON(channel: FakeDataChannel, json: string): void {
  channel.receive(Uint8Array.from([1, ...new TextEncoder().encode(json)]))
}

describe('useDeviceSyncSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDatabase.value = {}
    mockPersistImmediately.mockResolvedValue(undefined)
  })

  it('starts idle', () => {
    const session = useDeviceSyncSession()

    expect(session.phase.value).toBe('idle')
    expect(session.error.value).toBeNull()
  })

  it('sends the local payload, applies the peer payload, persists, and completes', async () => {
    mockSerialize.mockReturnValue('{"local":true}')
    mockParse.mockReturnValue(EMPTY_PAYLOAD)
    const channel = new FakeDataChannel()
    const session = useDeviceSyncSession()

    const runPromise = session.run(channel as unknown as RTCDataChannel)
    receiveJSON(channel, '{"peer":true}')
    await runPromise

    expect(channel.sent).toHaveLength(1)
    expect(mockParse).toHaveBeenCalledWith('{"peer":true}')
    expect(mockApply).toHaveBeenCalledWith(mockDatabase.value, EMPTY_PAYLOAD)
    expect(mockPersistImmediately).toHaveBeenCalledTimes(1)
    expect(session.phase.value).toBe('complete')
    expect(session.error.value).toBeNull()
  })

  it('moves to error when the database is not initialized', async () => {
    mockDatabase.value = null
    const channel = new FakeDataChannel()
    const session = useDeviceSyncSession()

    await session.run(channel as unknown as RTCDataChannel)

    expect(session.phase.value).toBe('error')
    expect(session.error.value).toBe('Database not initialized')
    expect(mockApply).not.toHaveBeenCalled()
  })

  it('moves to error and applies nothing when the connection closes before the peer payload arrives', async () => {
    mockSerialize.mockReturnValue('{}')
    const channel = new FakeDataChannel()
    const session = useDeviceSyncSession()

    const runPromise = session.run(channel as unknown as RTCDataChannel)
    channel.dispatchEvent(new Event('close'))
    await runPromise

    expect(session.phase.value).toBe('error')
    expect(session.error.value).toMatch(/closed before sync finished/i)
    expect(mockApply).not.toHaveBeenCalled()
    expect(mockPersistImmediately).not.toHaveBeenCalled()
  })

  it('moves to error when the peer payload is malformed', async () => {
    mockSerialize.mockReturnValue('{}')
    mockParse.mockImplementationOnce(() => {
      throw new Error('malformed sync payload JSON')
    })
    const channel = new FakeDataChannel()
    const session = useDeviceSyncSession()

    const runPromise = session.run(channel as unknown as RTCDataChannel)
    receiveJSON(channel, 'not valid json')
    await runPromise

    expect(session.phase.value).toBe('error')
    expect(session.error.value).toMatch(/malformed sync payload/i)
    expect(mockApply).not.toHaveBeenCalled()
  })

  it('moves to error when applying the merge throws, and never reports complete', async () => {
    mockSerialize.mockReturnValue('{}')
    mockParse.mockReturnValue(EMPTY_PAYLOAD)
    mockApply.mockImplementationOnce(() => {
      throw new Error('merge failed')
    })
    const channel = new FakeDataChannel()
    const session = useDeviceSyncSession()

    const runPromise = session.run(channel as unknown as RTCDataChannel)
    receiveJSON(channel, '{}')
    await runPromise

    expect(session.phase.value).toBe('error')
    expect(session.error.value).toBe('merge failed')
    expect(mockPersistImmediately).not.toHaveBeenCalled()
  })

  it('rejects when the channel is not open, without applying anything', async () => {
    mockSerialize.mockReturnValue('{}')
    const channel = new FakeDataChannel()
    channel.readyState = 'closed'
    const session = useDeviceSyncSession()

    await session.run(channel as unknown as RTCDataChannel)

    expect(session.phase.value).toBe('error')
    expect(session.error.value).toMatch(/not open/i)
    expect(mockApply).not.toHaveBeenCalled()
  })
})
