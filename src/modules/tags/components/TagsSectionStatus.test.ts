/**
 * Tests for TagsSectionStatus component
 */

import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import TagsSectionStatus from './TagsSectionStatus.vue'

describe('TagsSectionStatus', () => {
  it('shows a loading indicator while there is no error', () => {
    render(TagsSectionStatus, { props: { error: null } })

    expect(screen.getByRole('status', { name: 'Loading tags' })).toBeVisible()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows the error message', () => {
    render(TagsSectionStatus, { props: { error: 'DB read error' } })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Error loading tags: DB read error'
    )
  })

  it('emits retry when Retry is pressed', async () => {
    const { emitted } = render(TagsSectionStatus, {
      props: { error: 'DB read error' }
    })

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(emitted('retry')).toHaveLength(1)
  })
})
