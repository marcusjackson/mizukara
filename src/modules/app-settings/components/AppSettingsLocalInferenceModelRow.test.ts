import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppSettingsLocalInferenceModelRow from './AppSettingsLocalInferenceModelRow.vue'

import type { LocalInferenceModel } from '@/modules/local-inference/local-inference-types'

const MODEL: LocalInferenceModel = {
  downloadBytes: 34 * 1024 * 1024,
  dtype: 'q8',
  name: 'Tag suggestion model',
  note: 'Runs on this device.',
  repoId: 'org/model',
  weightsFile: 'model_quantized.onnx'
}

function mountRow(
  overrides: Partial<
    InstanceType<typeof AppSettingsLocalInferenceModelRow>['$props']
  > = {}
) {
  return mount(AppSettingsLocalInferenceModelRow, {
    props: {
      downloadProgress: null,
      installState: undefined,
      isBusy: false,
      isDownloading: false,
      model: MODEL,
      ...overrides
    }
  })
}

describe('AppSettingsLocalInferenceModelRow', () => {
  it('should show the download size before the button when nothing is installed', () => {
    const wrapper = mountRow()

    expect(wrapper.text()).toContain('34 MB')
    expect(wrapper.text()).toContain('Download')
  })

  it('should show progress and a cancel action while downloading', () => {
    const wrapper = mountRow({ downloadProgress: 40, isDownloading: true })

    expect(
      wrapper.find('[role="progressbar"]').attributes('aria-valuenow')
    ).toBe('40')
    expect(wrapper.text()).toContain('Cancel')
    const buttonLabels = wrapper
      .findAll('button')
      .map((button) => button.text())
    expect(buttonLabels).not.toContain('Download')
  })

  it('should offer deletion when the model is installed', () => {
    const wrapper = mountRow({
      installState: { hasAnyFiles: true, isInstalled: true }
    })

    expect(wrapper.text()).toContain('Delete')
    expect(wrapper.text()).not.toContain('Download')
  })

  it('should offer deletion for a partial download, which cannot otherwise be removed', () => {
    const wrapper = mountRow({
      installState: { hasAnyFiles: true, isInstalled: false }
    })

    expect(wrapper.text()).toContain('Delete')
    expect(wrapper.text()).toContain('Partly downloaded')
  })

  it('should say the model is in use when it is installed', () => {
    const wrapper = mountRow({
      installState: { hasAnyFiles: true, isInstalled: true }
    })

    expect(wrapper.text()).toContain('In use')
  })

  it('should emit a download request when the button is pressed', async () => {
    const wrapper = mountRow()

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('download')).toHaveLength(1)
  })

  it('should disable its actions when the engine is busy elsewhere', () => {
    const wrapper = mountRow({ isBusy: true })

    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })
})
