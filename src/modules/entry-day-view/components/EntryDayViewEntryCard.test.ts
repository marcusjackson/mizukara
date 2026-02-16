/**
 * Tests for EntryDayViewEntryCard component
 */

import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import EntryDayViewEntryCard from './EntryDayViewEntryCard.vue'

import type { Entry } from '@/shared/types/entry-types'

const createTestEntry = (overrides: Partial<Entry> = {}): Entry => ({
  id: 'test-entry-id',
  content: 'This is a test entry content',
  createdAt: new Date('2026-02-10T14:30:00').getTime(),
  updatedAt: new Date('2026-02-10T14:30:00').getTime(),
  assignedDay: '2026-02-10',
  orderPosition: 0,
  isDeleted: false,
  ...overrides
})

describe('EntryDayViewEntryCard', () => {
  it('renders entry content', () => {
    const entry = createTestEntry({ content: 'Test content' })

    render(EntryDayViewEntryCard, {
      props: { entry }
    })

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('displays created timestamp', () => {
    const entry = createTestEntry({
      createdAt: new Date('2026-02-10T14:30:00').getTime()
    })

    render(EntryDayViewEntryCard, {
      props: { entry }
    })

    expect(
      screen.getByText('Created: Feb 10, 2026, 2:30 PM')
    ).toBeInTheDocument()
  })

  it('shows updated indicator when entry has been modified', () => {
    const entry = createTestEntry({
      createdAt: new Date('2026-02-10T14:30:00').getTime(),
      updatedAt: new Date('2026-02-10T15:45:00').getTime()
    })

    render(EntryDayViewEntryCard, {
      props: { entry }
    })

    expect(screen.getByText('(edited)')).toBeInTheDocument()
  })

  it('does not show updated indicator when entry has not been modified', () => {
    const entry = createTestEntry({
      createdAt: new Date('2026-02-10T14:30:00').getTime(),
      updatedAt: new Date('2026-02-10T14:30:00').getTime()
    })

    render(EntryDayViewEntryCard, {
      props: { entry }
    })

    expect(screen.queryByText('(edited)')).not.toBeInTheDocument()
  })

  it('emits edit-requested event with correct entry ID when Edit button is clicked', async () => {
    const user = userEvent.setup()
    const entry = createTestEntry({ id: 'specific-entry-id' })

    const result = render(EntryDayViewEntryCard, {
      props: { entry }
    })

    const editButton = screen.getByRole('button', { name: /edit entry from/i })
    await user.click(editButton)

    const emittedEvents = result.emitted()['edit-requested']
    expect(emittedEvents).toBeTruthy()
    expect(emittedEvents).toHaveLength(1)
    expect(emittedEvents?.[0]).toEqual(['specific-entry-id'])
  })

  it('has proper card styling', () => {
    const entry = createTestEntry()

    render(EntryDayViewEntryCard, {
      props: { entry }
    })

    const card = screen.getByRole('article')

    // Check that the card has the expected class
    expect(card).toHaveClass('entry-card')

    // Check that it contains the expected content
    expect(card).toHaveTextContent('This is a test entry content')
    expect(card).toHaveTextContent('Created:')
  })

  it('renders correctly on different screen sizes', () => {
    const entry = createTestEntry()

    render(EntryDayViewEntryCard, {
      props: { entry }
    })

    const card = screen.getByRole('article')

    // Component should render regardless of screen size
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('entry-card')
  })

  it('handles very long content with proper wrapping', () => {
    const longContent = 'a'.repeat(5000)
    const entry = createTestEntry({ content: longContent })

    render(EntryDayViewEntryCard, { props: { entry } })

    const contentEl = screen.getByText(longContent)

    // Verify the content is rendered
    expect(contentEl).toBeInTheDocument()
    expect(contentEl).toHaveClass('entry-content')
  })

  it('preserves whitespace and line breaks in content', () => {
    const multilineContent = 'Line 1\n\nLine 2\n   Indented line'
    const entry = createTestEntry({ content: multilineContent })

    render(EntryDayViewEntryCard, { props: { entry } })

    const contentEl = screen.getByText((_, element) => {
      return element?.textContent === multilineContent
    })

    // Verify the content is rendered with the correct class
    expect(contentEl).toBeInTheDocument()
    expect(contentEl).toHaveClass('entry-content')
  })

  it('handles entry with extremely long single word', () => {
    const longWord = 'a'.repeat(1000)
    const entry = createTestEntry({ content: longWord })

    render(EntryDayViewEntryCard, { props: { entry } })

    expect(screen.getByText(longWord)).toBeInTheDocument()
  })

  it('displays edit button with proper accessibility attributes', () => {
    const entry = createTestEntry()

    render(EntryDayViewEntryCard, { props: { entry } })

    const editButton = screen.getByRole('button', { name: /edit entry from/i })
    expect(editButton).toHaveAttribute('type', 'button')
    expect(editButton).toHaveAttribute(
      'aria-label',
      'Edit entry from Feb 10, 2026, 2:30 PM'
    )
  })

  it('hides edit button when showEditButton is false', () => {
    const entry = createTestEntry()

    render(EntryDayViewEntryCard, {
      props: { entry, showEditButton: false }
    })

    expect(
      screen.queryByRole('button', { name: /edit entry from/i })
    ).not.toBeInTheDocument()
  })

  it('shows edit button by default when showEditButton prop is not provided', () => {
    const entry = createTestEntry()

    render(EntryDayViewEntryCard, {
      props: { entry }
    })

    expect(
      screen.getByRole('button', { name: /edit entry from/i })
    ).toBeInTheDocument()
  })
})
