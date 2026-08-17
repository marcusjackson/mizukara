import { ref } from 'vue'

import { withSetup } from '@test/helpers/with-setup'
import { afterEach, describe, expect, it } from 'vitest'

import { useComboboxMulti } from './use-combobox-multi'

import type { ComboboxOption } from './use-combobox-multi'
import type { App } from 'vue'

const OPTIONS: ComboboxOption[] = [
  { value: '1', label: 'Apple' },
  { value: '2', label: 'Banana' },
  { value: '3', label: 'Cherry' }
]

function setup(selectedValues: (string | number)[] = []) {
  const model = ref<(string | number)[]>(selectedValues)
  const options = ref(OPTIONS)
  const [result, app] = withSetup(() =>
    useComboboxMulti(model, options, {
      disabled: ref(false),
      name: ref(undefined),
      required: ref(false)
    })
  )
  return { model, options, ...result, app }
}

describe('useComboboxMulti', () => {
  let app: App | undefined

  afterEach(() => {
    app?.unmount()
  })

  describe('filteredOptions', () => {
    it('returns all options when search term is empty', () => {
      const result = setup()
      app = result.app

      expect(result.filteredOptions.value).toHaveLength(3)
    })

    it('filters options by label when searching', () => {
      const result = setup()
      app = result.app

      result.searchTerm.value = 'ban'

      expect(result.filteredOptions.value).toHaveLength(1)
      expect(result.filteredOptions.value[0]!.label).toBe('Banana')
    })

    it('returns empty array when no options match search', () => {
      const result = setup()
      app = result.app

      result.searchTerm.value = 'xyz'

      expect(result.filteredOptions.value).toHaveLength(0)
    })
  })

  describe('selectedOptions', () => {
    it('returns empty array when no values are selected', () => {
      const result = setup([])
      app = result.app

      expect(result.selectedOptions.value).toHaveLength(0)
    })

    it('returns matching option objects for selected values', () => {
      const result = setup(['1', '3'])
      app = result.app

      expect(result.selectedOptions.value).toHaveLength(2)
      expect(result.selectedOptions.value[0]!.label).toBe('Apple')
      expect(result.selectedOptions.value[1]!.label).toBe('Cherry')
    })
  })

  describe('handleModelUpdate', () => {
    it('updates model with new option values', () => {
      const result = setup([])
      app = result.app

      result.handleModelUpdate([OPTIONS[0]!, OPTIONS[2]!])

      expect(result.model.value).toEqual(['1', '3'])
    })

    it('clears search term after update', () => {
      const result = setup([])
      app = result.app

      result.searchTerm.value = 'app'
      result.handleModelUpdate([OPTIONS[0]!])

      expect(result.searchTerm.value).toBe('')
    })

    it('replaces existing selection with new selection', () => {
      const result = setup(['1', '2'])
      app = result.app

      result.handleModelUpdate([OPTIONS[2]!])

      expect(result.model.value).toEqual(['3'])
    })
  })

  describe('removeItem', () => {
    it('removes a selected item by value', () => {
      const result = setup(['1', '2', '3'])
      app = result.app

      result.removeItem('2')

      expect(result.model.value).toEqual(['1', '3'])
    })

    it('does nothing when removing a non-selected value', () => {
      const result = setup(['1', '3'])
      app = result.app

      result.removeItem('2')

      expect(result.model.value).toEqual(['1', '3'])
    })
  })

  describe('comboboxRootProps', () => {
    it('sets multiple to true', () => {
      const result = setup()
      app = result.app

      expect(result.comboboxRootProps.value).toMatchObject({ multiple: true })
    })

    it('sets ignoreFilter to true', () => {
      const result = setup()
      app = result.app

      expect(result.comboboxRootProps.value).toMatchObject({
        ignoreFilter: true
      })
    })

    it('includes name prop when provided', () => {
      const model = ref<(string | number)[]>([])
      const options = ref(OPTIONS)
      const [{ comboboxRootProps }, a] = withSetup(() =>
        useComboboxMulti(model, options, {
          disabled: ref(false),
          name: ref('tags'),
          required: ref(false)
        })
      )
      app = a

      expect(comboboxRootProps.value).toMatchObject({ name: 'tags' })
    })
  })
})
