/**
 * Base Components
 *
 * Generic UI components that work in any Vue project.
 *
 * @module base/components
 */

export { default as BaseBadge } from './BaseBadge.vue'
export { default as BaseButton } from './BaseButton.vue'
export { default as BaseCombobox } from './BaseCombobox.vue'
export { default as BaseComboboxMulti } from './BaseComboboxMulti.vue'
export { default as BaseDialog } from './BaseDialog.vue'
export { default as BaseFileInput } from './BaseFileInput.vue'
export { default as BaseInput } from './BaseInput.vue'
export { default as BaseSelect } from './BaseSelect.vue'
export { default as BaseSpinner } from './BaseSpinner.vue'
export { default as BaseSwitch } from './BaseSwitch.vue'
export { default as BaseTextarea } from './BaseTextarea.vue'
export { default as BaseToast } from './BaseToast.vue'

// Re-export types
export type { ComboboxOption } from './BaseCombobox.vue'
export type { ComboboxOption as ComboboxMultiOption } from './BaseComboboxMulti.vue'
export type { SelectOption } from './BaseSelect.vue'
