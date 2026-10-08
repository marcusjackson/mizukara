import { ref } from 'vue'

import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AppSettingsSectionLocalInference from './AppSettingsSectionLocalInference.vue'

import type {
  ModelInstallState,
  StorageUsage
} from '@/modules/local-inference/local-inference-types'

const engine = {
  cancelDownload: vi.fn(),
  deleteModel: vi.fn(),
  dismissError: vi.fn(),
  downloadModel: vi.fn(),
  downloadProgress: ref<number | null>(null),
  error: ref<string | null>(null),
  initialize: vi.fn(),
  installState: ref<ModelInstallState>({
    hasAnyFiles: false,
    isInstalled: false
  }),
  isStoragePersistent: ref<boolean | null>(null),
  state: ref('no-model'),
  teardown: vi.fn(),
  unsupportedReason: ref<string | null>(null)
}

const readStorageUsage = vi.fn<() => Promise<StorageUsage | null>>()

vi.mock(
  '@/modules/local-inference/composables/use-local-inference-engine',
  () => ({
    useLocalInferenceEngine: () => engine
  })
)

vi.mock('@/modules/local-inference/utils/model-cache-storage', () => ({
  readStorageUsage: (): Promise<StorageUsage | null> => readStorageUsage()
}))

async function mountSection() {
  const wrapper = mount(AppSettingsSectionLocalInference)
  await Promise.resolve()
  await Promise.resolve()
  return wrapper
}

describe('AppSettingsSectionLocalInference', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    engine.state.value = 'no-model'
    engine.error.value = null
    engine.unsupportedReason.value = null
    engine.downloadProgress.value = null
    engine.installState.value = { hasAnyFiles: false, isInstalled: false }
    engine.initialize.mockResolvedValue(undefined)
    readStorageUsage.mockResolvedValue({
      isPersistent: true,
      quotaBytes: 2 * 1024 * 1024 * 1024,
      usageBytes: 300 * 1024 * 1024
    })
  })

  it('should explain why and offer no models when the device is unsupported', async () => {
    engine.state.value = 'unsupported'
    engine.unsupportedReason.value = 'no-worker'

    const wrapper = await mountSection()

    expect(wrapper.text()).toContain('cannot run background workers')
    expect(wrapper.text()).not.toContain('Tag suggestion model')
  })

  it('should still promise word-based suggestions when unsupported', async () => {
    engine.state.value = 'unsupported'
    engine.unsupportedReason.value = 'no-webassembly'

    const wrapper = await mountSection()

    expect(wrapper.text()).toContain('words already in your entry still work')
  })

  it('should offer the one model when the device is supported', async () => {
    const wrapper = await mountSection()

    expect(wrapper.text()).toContain('Tag suggestion model')
    expect(wrapper.text()).toContain('Download')
  })

  it('should offer no on/off switch or model choice, since installed means enabled', async () => {
    const wrapper = await mountSection()

    expect(wrapper.find('[role="switch"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Use this')
  })

  it('should download through the engine and refresh storage', async () => {
    const wrapper = await mountSection()

    await wrapper.find('button').trigger('click')

    expect(engine.downloadModel).toHaveBeenCalledTimes(1)
  })

  it('should report storage usage and persistence', async () => {
    const wrapper = await mountSection()

    expect(wrapper.text()).toContain('Using 300 MB of 2048 MB')
    expect(wrapper.text()).toContain('Storage is persistent')
  })

  it('should warn about the shared eviction boundary when storage is not persistent', async () => {
    readStorageUsage.mockResolvedValue({
      isPersistent: false,
      quotaBytes: 100,
      usageBytes: 1
    })

    const wrapper = await mountSection()

    expect(wrapper.text()).toContain('one eviction boundary')
  })

  it('should say so when the browser will not report storage', async () => {
    readStorageUsage.mockResolvedValue(null)

    const wrapper = await mountSection()

    expect(wrapper.text()).toContain('will not say how much storage')
  })

  it('should surface an engine error with a way to dismiss it', async () => {
    engine.error.value = 'out of memory'

    const wrapper = await mountSection()

    expect(wrapper.find('[role="alert"]').text()).toContain('out of memory')
  })
})
