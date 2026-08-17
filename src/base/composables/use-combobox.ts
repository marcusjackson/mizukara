/**
 * useCombobox
 *
 * Handles single-select combobox logic: filtering, selection,
 * and display value computation. Used by BaseCombobox.
 */
import { computed, ref, watch } from 'vue'

import { useFilter } from 'reka-ui'

import type { ComputedRef, Ref } from 'vue'

export interface ComboboxOption {
  value: string | number
  label: string
  disabled?: boolean
  /** Additional fields for multi-key search */
  [key: string]: unknown
}

interface ComboboxConfig {
  disabled: Ref<boolean | undefined>
  displayFn?: Ref<((opt: ComboboxOption) => string) | undefined>
  displayValue?: Ref<((opt: ComboboxOption | undefined) => string) | undefined>
  name: Ref<string | undefined>
  required: Ref<boolean | undefined>
  searchKeys?: Ref<string[] | undefined>
}

/** Props passed to the ComboboxRoot element */
interface ComboboxRootBindings {
  disabled: boolean
  ignoreFilter: true
  required: boolean
  name?: string
}

function buildRootProps(
  disabled: Ref<boolean | undefined>,
  required: Ref<boolean | undefined>,
  name: Ref<string | undefined>
): ComboboxRootBindings {
  const props: ComboboxRootBindings = {
    disabled: disabled.value ?? false,
    ignoreFilter: true,
    required: required.value ?? false
  }
  if (name.value) props.name = name.value
  return props
}

export interface UseComboboxReturn {
  /** Root props to spread onto ComboboxRoot */
  comboboxRootProps: ComputedRef<ComboboxRootBindings>
  /** Filtered list of options based on the current search term */
  filteredOptions: ComputedRef<ComboboxOption[]>
  /** Function to get the display value for the selected option */
  getDisplayValue: ComputedRef<(opt: ComboboxOption | undefined) => string>
  /** Function to get display text for a given option in the dropdown */
  getOptionDisplayText: ComputedRef<(opt: ComboboxOption) => string>
  /** The current search term typed by the user */
  searchTerm: Ref<string>
  /** The currently selected option, or null if none */
  selectedOption: ComputedRef<ComboboxOption | null>
  /** Handle native input events to update the search term */
  handleInputChange: (event: Event) => void
  /** Handle option selection from the dropdown */
  handleSelect: (option: ComboboxOption) => void
}

const defaultDisplayValue = (opt: ComboboxOption | undefined): string =>
  opt?.label ?? ''

const defaultDisplayFn = (opt: ComboboxOption): string => opt.label

/**
 * Manages single-select combobox state: filtering, option selection, and
 * display value computation.
 *
 * @param model - The currently selected value (string, number, or null)
 * @param options - Array of options to display in the dropdown
 * @param config - Configuration with reactive refs for disabled, name, required, etc.
 * @returns Composable state and handlers for use with BaseCombobox
 */
export function useCombobox(
  model: Ref<string | number | null>,
  options: Ref<ComboboxOption[]>,
  config: ComboboxConfig
): UseComboboxReturn {
  const { contains } = useFilter({ sensitivity: 'base' })
  const searchTerm = ref('')

  watch(model, () => {
    searchTerm.value = ''
  })

  const filteredOptions = computed(() => {
    if (!searchTerm.value) return options.value
    const keys = config.searchKeys?.value ?? ['label']
    return options.value.filter((opt) =>
      keys.some((key) => {
        const val = opt[key]
        return typeof val === 'string' && contains(val, searchTerm.value)
      })
    )
  })

  const selectedOption = computed(
    () => options.value.find((opt) => opt.value === model.value) ?? null
  )

  const getDisplayValue = computed(
    () => config.displayValue?.value ?? defaultDisplayValue
  )

  const getOptionDisplayText = computed(
    () => config.displayFn?.value ?? defaultDisplayFn
  )

  const comboboxRootProps = computed(() =>
    buildRootProps(config.disabled, config.required, config.name)
  )

  function handleInputChange(event: Event): void {
    searchTerm.value = (event.target as HTMLInputElement).value
  }

  function handleSelect(option: ComboboxOption): void {
    model.value = option.value
    searchTerm.value = ''
  }

  return {
    comboboxRootProps,
    filteredOptions,
    getDisplayValue,
    getOptionDisplayText,
    searchTerm,
    selectedOption,
    handleInputChange,
    handleSelect
  }
}
