/**
 * Tests for EntryDayViewSectionList component
 *
 * Section component that manages entry list display, create form,
 * view/edit modes, and reorder functionality.
 */

import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import EntryDayViewSectionList from './EntryDayViewSectionList.vue'

import type { Entry } from '@/shared/types/entry-types'
import type { Tag } from '@/shared/types/tag-types'

// Mock the mutations composable
const mockCreateNewEntry = vi.fn()
const mockUpdateExistingEntry = vi.fn()

vi.mock('../composables/use-entry-day-view-mutations', () => ({
  useEntryDayViewMutations: () => ({
    createNewEntry: mockCreateNewEntry,
    updateExistingEntry: mockUpdateExistingEntry
  })
}))

// Mock the toast composable
const mockSuccessToast = vi.fn()
const mockErrorToast = vi.fn()

vi.mock('@/shared/composables/use-toast', () => ({
  useToast: () => ({
    success: mockSuccessToast,
    error: mockErrorToast,
    info: vi.fn(),
    warning: vi.fn(),
    toasts: { value: [] },
    addToast: vi.fn(),
    removeToast: vi.fn()
  })
}))

const createTestEntry = (overrides: Partial<Entry> = {}): Entry => ({
  id: 'test-entry-id',
  content: 'Test entry content',
  createdAt: new Date('2026-02-10T14:30:00').getTime(),
  updatedAt: new Date('2026-02-10T14:30:00').getTime(),
  assignedDay: '2026-02-10',
  orderPosition: 0,
  isDeleted: false,
  ...overrides
})

describe('EntryDayViewSectionList', () => {
  const defaultProps = {
    items: [] as Entry[],
    currentDate: '2026-02-10',
    onRefetch: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateNewEntry.mockResolvedValue(undefined)
    mockUpdateExistingEntry.mockResolvedValue(undefined)
  })

  describe('Create Form', () => {
    it('renders create form at top', () => {
      render(EntryDayViewSectionList, {
        props: defaultProps
      })

      // Create form has unique placeholder
      expect(
        screen.getByPlaceholderText(/what happened today/i)
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /new entry/i })
      ).toBeInTheDocument()
    })

    // Note: Testing actual database mutations is outside the scopeof component tests
    // Integration tests with real database are in E2E tests
  })

  describe('Entry List Display', () => {
    it('renders entry cards for each item', () => {
      const items = [
        createTestEntry({ id: '1', content: 'First entry' }),
        createTestEntry({ id: '2', content: 'Second entry' })
      ]

      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items }
      })

      expect(screen.getByText('First entry')).toBeInTheDocument()
      expect(screen.getByText('Second entry')).toBeInTheDocument()
    })

    it('renders entries in order provided', () => {
      const items = [
        createTestEntry({ id: '1', content: 'First', orderPosition: 0 }),
        createTestEntry({ id: '2', content: 'Second', orderPosition: 1 }),
        createTestEntry({ id: '3', content: 'Third', orderPosition: 2 })
      ]

      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items }
      })

      const cards = screen.getAllByRole('article')
      expect(cards).toHaveLength(3)
    })

    it('passes tags from entryTagsMap to each entry card', () => {
      const entry1 = createTestEntry({ id: 'entry-1', content: 'Entry one' })
      const entry2 = createTestEntry({ id: 'entry-2', content: 'Entry two' })

      const tag1: Tag = {
        id: 'tag-1',
        name: 'TypeScript',
        createdAt: 1000,
        updatedAt: 1000,
        isDeleted: false
      }
      const tag2: Tag = {
        id: 'tag-2',
        name: 'Vue',
        createdAt: 1000,
        updatedAt: 1000,
        isDeleted: false
      }

      const entryTagsMap = new Map<string, Tag[]>([
        ['entry-1', [tag1]],
        ['entry-2', [tag2]]
      ])

      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items: [entry1, entry2], entryTagsMap }
      })

      expect(screen.getByText('TypeScript')).toBeInTheDocument()
      expect(screen.getByText('Vue')).toBeInTheDocument()
    })

    it('renders entry cards without tags when entryTagsMap is absent', () => {
      const entry = createTestEntry({ id: 'entry-1', content: 'No tags' })

      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items: [entry] }
      })

      // 'entry-tags' container should not be present when no tags
      expect(screen.queryByTestId('entry-tags')).not.toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('displays empty state message when no entries', () => {
      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items: [] }
      })

      expect(
        screen.getByText(/no entries yet.*start writing/i)
      ).toBeInTheDocument()
    })

    it('empty state appears below create form', () => {
      const { container } = render(EntryDayViewSectionList, {
        props: { ...defaultProps, items: [] }
      })

      const createForm = screen.getByLabelText(/content/i).closest('section')
      const emptyState = screen.getByText(/no entries yet/i)

      // In DOM order, form should come before empty state
      const allElements = Array.from(container.querySelectorAll('*'))
      const formIndex = allElements.indexOf(createForm!)
      const emptyIndex = allElements.indexOf(emptyState)

      expect(formIndex).toBeLessThan(emptyIndex)
    })

    it('empty state uses correct styling classes', () => {
      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items: [] }
      })

      const emptyState = screen.getByText(/no entries yet/i)
      expect(emptyState.className).toContain('empty-state')
    })

    it('hides empty state when entries exist', () => {
      const items = [createTestEntry()]

      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items }
      })

      expect(screen.queryByText(/no entries yet/i)).not.toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    it('replaces card with editor when edit requested', async () => {
      const user = userEvent.setup()
      const entry = createTestEntry({ content: 'Test content' })

      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items: [entry] }
      })

      const editButton = screen.getByRole('button', { name: /edit entry/i })
      await user.click(editButton)

      // Card should be replaced by editor
      expect(screen.queryByText('Test content')).not.toBeInTheDocument()
      // Editor textarea has different placeholder
      expect(
        screen.getByPlaceholderText(/enter your thoughts/i)
      ).toBeInTheDocument()
    })

    it('shows save and cancel buttons in edit mode', async () => {
      const user = userEvent.setup()
      const entry = createTestEntry({ content: 'Original content' })

      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items: [entry] }
      })

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit entry/i })
      await user.click(editButton)

      // Should show Save and Cancel buttons
      expect(
        screen.getByRole('button', { name: /^save$/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument()
    })

    it('exits edit mode on cancel without calling onRefetch', async () => {
      const user = userEvent.setup()
      const onRefetch = vi.fn()
      const entry = createTestEntry({ content: 'Original content' })

      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items: [entry], onRefetch }
      })

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit entry/i })
      await user.click(editButton)

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        // Should show card again (check for content text)
        expect(screen.getByText('Original content')).toBeInTheDocument()
      })

      // Should not have refetched
      expect(onRefetch).not.toHaveBeenCalled()
    })

    it('only allows editing one entry at a time', async () => {
      const user = userEvent.setup()
      const items = [
        createTestEntry({ id: '1', content: 'First entry' }),
        createTestEntry({ id: '2', content: 'Second entry' })
      ]

      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items }
      })

      const editButtons = screen.getAllByRole('button', { name: /edit entry/i })
      expect(editButtons).toHaveLength(2)

      const firstEditButton = editButtons[0]
      expect(firstEditButton).toBeDefined()
      await user.click(firstEditButton!)

      // First entry should be in edit mode (editor textarea has unique placeholder)
      expect(
        screen.getByPlaceholderText(/enter your thoughts/i)
      ).toBeInTheDocument()

      // Second entry's edit button should be disabled
      const remainingEditButton = screen.getByRole('button', {
        name: /edit entry/i
      })
      expect(remainingEditButton).toBeDisabled()
    })
  })

  describe('Reorder Mode', () => {
    it('shows reorder mode toggle button', () => {
      const items = [createTestEntry(), createTestEntry({ id: '2' })]

      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items }
      })

      expect(
        screen.getByRole('button', { name: /reorder entries/i })
      ).toBeInTheDocument()
    })

    it('enters reorder mode when toggle button clicked', async () => {
      const user = userEvent.setup()
      const items = [createTestEntry(), createTestEntry({ id: '2' })]

      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items }
      })

      const toggleButton = screen.getByRole('button', {
        name: /reorder entries/i
      })
      await user.click(toggleButton)

      // Button text changes to "Done" in reorder mode
      expect(
        screen.getByRole('button', { name: /done reordering/i })
      ).toBeInTheDocument()
    })

    it('shows move up/down buttons in reorder mode', async () => {
      const user = userEvent.setup()
      const items = [
        createTestEntry({ id: '1', content: 'First' }),
        createTestEntry({ id: '2', content: 'Second' })
      ]

      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items }
      })

      // Enter reorder mode
      await user.click(screen.getByRole('button', { name: /reorder entries/i }))

      // Should show move buttons for each entry
      expect(screen.getAllByRole('button', { name: /move up/i })).toHaveLength(
        2
      )
      expect(
        screen.getAllByRole('button', { name: /move down/i })
      ).toHaveLength(2)
    })

    it('hides edit buttons in reorder mode', async () => {
      const user = userEvent.setup()
      const items = [
        createTestEntry({ id: '1', content: 'First' }),
        createTestEntry({ id: '2', content: 'Second' })
      ]

      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items }
      })

      // Edit button visible in view mode
      expect(
        screen.getAllByRole('button', { name: /edit entry/i })
      ).toHaveLength(2)

      // Enter reorder mode
      await user.click(screen.getByRole('button', { name: /reorder entries/i }))

      // Edit buttons hidden
      expect(
        screen.queryByRole('button', { name: /edit entry/i })
      ).not.toBeInTheDocument()
    })

    it('disables first entry move up button', async () => {
      const user = userEvent.setup()
      const items = [
        createTestEntry({ id: '1', content: 'First' }),
        createTestEntry({ id: '2', content: 'Second' })
      ]

      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items }
      })

      await user.click(screen.getByRole('button', { name: /reorder entries/i }))

      const moveUpButtons = screen.getAllByRole('button', { name: /move up/i })
      expect(moveUpButtons[0]).toBeDisabled() // First entry can't move up
      expect(moveUpButtons[1]).toBeEnabled() // Second entry can move up
    })

    it('disables last entry move down button', async () => {
      const user = userEvent.setup()
      const items = [
        createTestEntry({ id: '1', content: 'First' }),
        createTestEntry({ id: '2', content: 'Second' })
      ]

      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items }
      })

      await user.click(screen.getByRole('button', { name: /reorder entries/i }))

      const moveDownButtons = screen.getAllByRole('button', {
        name: /move down/i
      })
      expect(moveDownButtons[0]).toBeEnabled() // First entry can move down
      expect(moveDownButtons[1]).toBeDisabled() // Last entry can't move down
    })

    it('hides reorder toggle when no entries exist', () => {
      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items: [] }
      })

      expect(
        screen.queryByRole('button', { name: /reorder entries/i })
      ).not.toBeInTheDocument()
    })

    it('hides reorder toggle when only one entry exists', () => {
      const items = [createTestEntry()]

      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items }
      })

      expect(
        screen.queryByRole('button', { name: /reorder entries/i })
      ).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('provides proper semantic structure', () => {
      const { container } = render(EntryDayViewSectionList, {
        props: defaultProps
      })

      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('maintains keyboard navigation flow', async () => {
      const user = userEvent.setup()
      const entry = createTestEntry()

      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items: [entry] }
      })

      const textarea = screen.getByLabelText(/content/i)

      // Tab through elements
      await user.tab()
      expect(textarea).toHaveFocus()
    })
  })

  describe('Toast Notifications', () => {
    it('shows success toast when entry is created', async () => {
      render(EntryDayViewSectionList, {
        props: defaultProps
      })

      const user = userEvent.setup()
      const textarea = screen.getByLabelText(/content/i)
      const submitButton = screen.getByRole('button', { name: /new entry/i })

      await user.type(textarea, 'New entry content')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSuccessToast).toHaveBeenCalledWith(
          'Entry created successfully'
        )
      })
    })

    it('shows error toast when entry creation fails', async () => {
      mockCreateNewEntry.mockRejectedValueOnce(new Error('Database error'))

      render(EntryDayViewSectionList, {
        props: defaultProps
      })

      const user = userEvent.setup()
      const textarea = screen.getByLabelText(/content/i)
      const submitButton = screen.getByRole('button', { name: /new entry/i })

      await user.type(textarea, 'New entry content')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockErrorToast).toHaveBeenCalledWith('Database error')
      })
    })

    it('shows success toast when entry is updated', async () => {
      const entry = createTestEntry({ content: 'Original content' })

      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items: [entry] }
      })

      const user = userEvent.setup()

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit entry/i })
      await user.click(editButton)

      // Update content
      const textarea = screen.getByPlaceholderText(/enter your thoughts/i)
      await user.clear(textarea)
      await user.type(textarea, 'Updated content')

      // Save
      const saveButton = screen.getByRole('button', { name: /^save$/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockSuccessToast).toHaveBeenCalledWith(
          'Entry updated successfully'
        )
      })
    })

    it('shows error toast when entry update fails', async () => {
      mockUpdateExistingEntry.mockRejectedValueOnce(new Error('Update failed'))

      const entry = createTestEntry({ content: 'Original content' })

      render(EntryDayViewSectionList, {
        props: { ...defaultProps, items: [entry] }
      })

      const user = userEvent.setup()

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit entry/i })
      await user.click(editButton)

      // Update content
      const textarea = screen.getByPlaceholderText(/enter your thoughts/i)
      await user.clear(textarea)
      await user.type(textarea, 'Updated content')

      // Save
      const saveButton = screen.getByRole('button', { name: /^save$/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockErrorToast).toHaveBeenCalledWith('Update failed')
      })
    })
  })
})
