/**
 * useAutoExpandTextarea
 *
 * Generic composable that auto-grows a textarea element to fit its content,
 * up to an optional maximum number of visible rows. When the content exceeds
 * the maximum height the textarea becomes scrollable.
 *
 * Works in any Vue project (base layer – no app-specific dependencies).
 *
 * @param textareaEl - Template ref pointing to the HTMLTextAreaElement
 * @param value      - Reactive value whose changes trigger height recalculation
 * @param options    - enabled: whether auto-expand is active; maxRows: optional ceiling
 *
 * @example
 * ```typescript
 * const textareaEl = ref<HTMLTextAreaElement | null>(null)
 * useAutoExpandTextarea(textareaEl, model, {
 *   enabled: computed(() => props.autoExpand ?? false),
 *   maxRows: props.maxRows,
 * })
 * ```
 */

import { nextTick, onMounted, type Ref, watch } from 'vue'

interface AutoExpandOptions {
  /** Whether auto-expand behaviour is active */
  enabled: Ref<boolean>
  /** Maximum number of rows before the textarea scrolls (undefined = unlimited) */
  maxRows?: number
}

export function useAutoExpandTextarea(
  textareaEl: Ref<HTMLTextAreaElement | null>,
  value: Ref<string | undefined>,
  options: AutoExpandOptions
): void {
  const adjustHeight = (): void => {
    if (!options.enabled.value) return

    const el = textareaEl.value
    if (!el) return

    // Collapse to recalculate scrollHeight correctly
    el.style.height = 'auto'

    if (typeof options.maxRows === 'number') {
      const lineHeight =
        Number.parseFloat(getComputedStyle(el).lineHeight) || 20
      const paddingTop = Number.parseFloat(getComputedStyle(el).paddingTop) || 0
      const paddingBottom =
        Number.parseFloat(getComputedStyle(el).paddingBottom) || 0
      const maxHeight =
        options.maxRows * lineHeight + paddingTop + paddingBottom

      if (el.scrollHeight >= maxHeight) {
        el.style.height = `${String(maxHeight)}px`
        el.style.overflowY = 'auto'
      } else {
        el.style.height = `${String(el.scrollHeight)}px`
        el.style.overflowY = 'hidden'
      }
    } else {
      el.style.height = `${String(el.scrollHeight)}px`
      el.style.overflowY = 'hidden'
    }
  }

  watch(value, async () => {
    await nextTick(adjustHeight)
  })

  onMounted(async () => {
    await nextTick(adjustHeight)
  })
}
