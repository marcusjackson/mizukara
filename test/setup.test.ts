/**
 * Example test to verify Vitest setup
 */
import { describe, expect, it } from 'vitest'

describe('vitest setup', () => {
  it('should run tests', () => {
    expect(true).toBe(true)
  })

  it('should have testing-library matchers', () => {
    const element = document.createElement('div')
    element.textContent = 'Hello'
    document.body.appendChild(element)

    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Hello')

    element.remove()
  })
})
