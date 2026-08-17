import { ref } from 'vue'

import { withSetup } from '@test/helpers/with-setup'
import { afterEach, describe, expect, it } from 'vitest'

import { useCombobox } from './use-combobox'

import type { ComboboxOption } from './use-combobox'
import type { App } from 'vue'

type ModelValue = string | number | null

const OPTIONS: ComboboxOption[] = [
  { value: '1', label: 'Apple' },
  { value: '2', label: 'Banana' },
  { value: '3', label: 'Cherry', disabled: true }
]

function setup(
  modelValue: ModelValue = null,
  overrides: Partial<Parameters<typeof useCombobox>[2]> = {}
) {
  const model = ref<ModelValue>(modelValue)
  const options = ref(OPTIONS)
  const [result, app] = withSetup(() =>
    useCombobox(model, options, {
      disabled: ref(false),
      name: ref(undefined),
      required: ref(false),
      ...overrides
    })
  )
  return { model, options, ...result, app }
}

describe('useCombobox', () => {
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

      result.handleInputChange({
        target: { value: 'app' }
      } as unknown as Event)

      expect(result.filteredOptions.value).toHaveLength(1)
      expect(result.filteredOptions.value[0]!.label).toBe('Apple')
    })

    it('returns empty array when no options match search', () => {
      const result = setup()
      app = result.app

      result.handleInputChange({
        target: { value: 'xyz' }
      } as unknown as Event)

      expect(result.filteredOptions.value).toHaveLength(0)
    })

    it('filters across multiple search keys when configured', () => {
      const multiKeyOptions: ComboboxOption[] = [
        { value: '1', label: 'John Doe', email: 'john@example.com' },
        { value: '2', label: 'Jane Smith', email: 'jane@example.com' }
      ]
      const model = ref<string | number | null>(null)
      const [result, a] = withSetup(() =>
        useCombobox(model, ref(multiKeyOptions), {
          disabled: ref(false),
          name: ref(undefined),
          required: ref(false),
          searchKeys: ref(['label', 'email'])
        })
      )
      app = a

      result.handleInputChange({
        target: { value: 'jane@' }
      } as unknown as Event)

      expect(result.filteredOptions.value).toHaveLength(1)
      expect(result.filteredOptions.value[0]!.label).toBe('Jane Smith')
    })
  })

  describe('selectedOption', () => {
    it('returns null when no value is selected', () => {
      const result = setup(null)
      app = result.app

      expect(result.selectedOption.value).toBeNull()
    })

    it('returns the matching option when a value is set', () => {
      const result = setup('2')
      app = result.app

      expect(result.selectedOption.value?.label).toBe('Banana')
    })

    it('returns null for unknown value', () => {
      const result = setup('unknown')
      app = result.app

      expect(result.selectedOption.value).toBeNull()
    })
  })

  describe('handleSelect', () => {
    it('updates model value on selection', () => {
      const result = setup()
      app = result.app

      result.handleSelect(OPTIONS[1]!)

      expect(result.model.value).toBe('2')
    })

    it('clears search term after selection', () => {
      const result = setup()
      app = result.app

      result.handleInputChange({
        target: { value: 'ban' }
      } as unknown as Event)
      expect(result.searchTerm.value).toBe('ban')

      result.handleSelect(OPTIONS[1]!)
      expect(result.searchTerm.value).toBe('')
    })
  })

  describe('display value', () => {
    it('uses default display value that returns option label', () => {
      const result = setup('1')
      app = result.app

      expect(result.getDisplayValue.value(OPTIONS[0])).toBe('Apple')
      expect(result.getDisplayValue.value(undefined)).toBe('')
    })

    it('uses custom display value function when provided', () => {
      const customFn = ref((opt: ComboboxOption | undefined) =>
        opt ? `Item: ${opt.label}` : 'None'
      )
      const result = setup(null, { displayValue: customFn })
      app = result.app

      expect(result.getDisplayValue.value(OPTIONS[0])).toBe('Item: Apple')
    })

    it('uses custom option display function when provided', () => {
      const customFn = ref((opt: ComboboxOption) => opt.label.toUpperCase())
      const result = setup(null, { displayFn: customFn })
      app = result.app

      expect(result.getOptionDisplayText.value(OPTIONS[0]!)).toBe('APPLE')
    })
  })

  describe('comboboxRootProps', () => {
    it('includes name prop when provided', () => {
      const result = setup(null, { name: ref('fruit') })
      app = result.app

      expect(result.comboboxRootProps.value).toMatchObject({ name: 'fruit' })
    })

    it('omits name prop when name is undefined', () => {
      const result = setup()
      app = result.app

      expect(result.comboboxRootProps.value).not.toHaveProperty('name')
    })

    it('sets ignoreFilter to true', () => {
      const result = setup()
      app = result.app

      expect(result.comboboxRootProps.value).toMatchObject({
        ignoreFilter: true
      })
    })
  })
})
