/**
 * useComboboxMulti
 *
 * Handles multi-select combobox logic: filtering, selection,
 * and chip management. Used by BaseComboboxMulti.
 */
import { computed, ref } from 'vue'

import { useFilter } from 'reka-ui'

import type { ComputedRef, Ref } from 'vue'

export interface ComboboxOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface ComboboxMultiConfig {
  disabled: Ref<boolean | undefined>
  name: Ref<string | undefined>
  required: Ref<boolean | undefined>
}

/** Props passed to the ComboboxRoot element in multi-select mode */
interface ComboboxMultiRootBindings {
  disabled: boolean
  ignoreFilter: true
  multiple: true
  required: boolean
  name?: string
}

function buildMultiRootProps(
  disabled: Ref<boolean | undefined>,
  required: Ref<boolean | undefined>,
  name: Ref<string | undefined>
): ComboboxMultiRootBindings {
  const props: ComboboxMultiRootBindings = {
    disabled: disabled.value ?? false,
    ignoreFilter: true,
    multiple: true,
    required: required.value ?? false
  }
  if (name.value) props.name = name.value
  return props
}

export interface UseComboboxMultiReturn {
  /** Root props to spread onto ComboboxRoot */
  comboboxRootProps: ComputedRef<ComboboxMultiRootBindings>
  /** Filtered list of options based on the current search term */
  filteredOptions: ComputedRef<ComboboxOption[]>
  /** The current search term typed by the user */
  searchTerm: Ref<string>
  /** The currently selected options */
  selectedOptions: ComputedRef<ComboboxOption[]>
  /** Handle option list update from the combobox (replaces selection) */
  handleModelUpdate: (newOptions: ComboboxOption[]) => void
  /** Remove a single item from the selection by value */
  removeItem: (value: string | number) => void
}

/**
 * Manages multi-select combobox state: filtering, multi-selection, and chip management.
 *
 * @param model - Array of currently selected values
 * @param options - Array of options to display in the dropdown
 * @param config - Configuration with reactive refs for disabled, name, and required
 * @returns Composable state and handlers for use with BaseComboboxMulti
 */
export function useComboboxMulti(
  model: Ref<(string | number)[]>,
  options: Ref<ComboboxOption[]>,
  config: ComboboxMultiConfig
): UseComboboxMultiReturn {
  const { contains } = useFilter({ sensitivity: 'base' })
  const searchTerm = ref('')

  const filteredOptions = computed(() =>
    searchTerm.value
      ? options.value.filter((opt) => contains(opt.label, searchTerm.value))
      : options.value
  )

  const selectedOptions = computed(() =>
    options.value.filter((opt) => model.value.includes(opt.value))
  )

  const comboboxRootProps = computed(() =>
    buildMultiRootProps(config.disabled, config.required, config.name)
  )

  function handleModelUpdate(newOptions: ComboboxOption[]): void {
    model.value = newOptions.map((opt) => opt.value)
    searchTerm.value = ''
  }

  function removeItem(value: string | number): void {
    model.value = model.value.filter((v) => v !== value)
  }

  return {
    comboboxRootProps,
    filteredOptions,
    searchTerm,
    selectedOptions,
    handleModelUpdate,
    removeItem
  }
}
