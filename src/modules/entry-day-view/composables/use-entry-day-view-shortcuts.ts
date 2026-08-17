/**
 * Registers all keyboard shortcuts for the entry day view.
 *
 * Extracts shortcut registration from EntryDayViewRoot to keep
 * the root component within its line limit.
 *
 * @param handlers - Object containing handler callbacks for each shortcut
 */
import { useKeyboardShortcuts } from '@/shared/composables/use-keyboard-shortcuts'

interface ShortcutHandlers {
  focusCreateForm: () => void
  goToNextDay: () => void
  goToPrevDay: () => void
  handleOpenDatePicker: () => void
  handleSave: () => void
  handleEscape: () => void
}

export function useEntryDayViewShortcuts(handlers: ShortcutHandlers) {
  useKeyboardShortcuts([
    { key: 'cmd+n', handler: handlers.focusCreateForm, preventDefault: true },
    { key: 'j', handler: handlers.goToNextDay, preventDefault: true },
    { key: 'k', handler: handlers.goToPrevDay, preventDefault: true },
    { key: 'arrowdown', handler: handlers.goToNextDay, preventDefault: true },
    { key: 'arrowup', handler: handlers.goToPrevDay, preventDefault: true },
    { key: 'g', handler: handlers.handleOpenDatePicker, preventDefault: true },
    { key: 'cmd+s', handler: handlers.handleSave, preventDefault: true },
    { key: 'escape', handler: handlers.handleEscape, preventDefault: false }
  ])
}
