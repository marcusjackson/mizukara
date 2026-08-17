/**
 * Tests for NotFoundPage
 *
 * Renders a 404 not-found message for unmatched routes.
 */

import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import NotFoundPage from './NotFoundPage.vue'

describe('NotFoundPage', () => {
  const renderPage = () =>
    render(NotFoundPage, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } }
    })

  it('displays a not-found heading', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: /page not found/i })
    ).toBeInTheDocument()
  })

  it('displays a descriptive message', () => {
    renderPage()

    expect(screen.getByText(/the page you.+looking for/i)).toBeInTheDocument()
  })

  it('renders a link to go home', () => {
    renderPage()

    expect(screen.getByText('Go to home')).toBeInTheDocument()
  })
})
