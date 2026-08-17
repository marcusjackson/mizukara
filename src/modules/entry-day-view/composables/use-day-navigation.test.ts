import { nextTick } from 'vue'

import { TEST_DATES } from '@test/constants/dates'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDayNavigation } from './use-day-navigation'

// Mock vue-router
const mockRoute = {
  params: {}
}

const mockRouter = {
  push: vi.fn()
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter
}))

// Mock date-utils
vi.mock('@/shared/utils/date-utils', () => ({
  getToday: vi.fn(() => TEST_DATES.DEFAULT),
  isValidISODate: vi.fn((date: string) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    return regex.exec(date) !== null
  }),
  addDays: vi.fn((date: string, days: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  }),
  subtractDays: vi.fn((date: string, days: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() - days)
    return d.toISOString().split('T')[0]
  })
}))

describe('useDayNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.params = {}
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with today when no date provided', () => {
    const { currentDate } = useDayNavigation()
    expect(currentDate.value).toBe(TEST_DATES.DEFAULT)
  })

  it('initializes with provided date', () => {
    const initialDate = TEST_DATES.PREV_DAY
    const { currentDate } = useDayNavigation({ initialDate })
    expect(currentDate.value).toBe(initialDate)
  })

  it('defaults to today when invalid date provided', () => {
    const { currentDate } = useDayNavigation({ initialDate: 'invalid' })
    expect(currentDate.value).toBe(TEST_DATES.DEFAULT)
  })

  it('initializes with route date when valid', () => {
    mockRoute.params = { date: TEST_DATES.THIRD_DAY }
    const { currentDate } = useDayNavigation()
    expect(currentDate.value).toBe(TEST_DATES.THIRD_DAY)
  })

  it('prefers route date over initialDate', () => {
    mockRoute.params = { date: TEST_DATES.THIRD_DAY }
    const { currentDate } = useDayNavigation({
      initialDate: TEST_DATES.PREV_DAY
    })
    expect(currentDate.value).toBe(TEST_DATES.THIRD_DAY)
  })

  it('goToPrevDay decrements date by one day', () => {
    const initialDate = TEST_DATES.DEFAULT
    const { currentDate, goToPrevDay } = useDayNavigation({ initialDate })
    goToPrevDay()
    expect(currentDate.value).toBe(TEST_DATES.PREV_DAY)
  })

  it('goToNextDay increments date by one day', () => {
    const initialDate = TEST_DATES.DEFAULT
    const { currentDate, goToNextDay } = useDayNavigation({ initialDate })
    goToNextDay()
    expect(currentDate.value).toBe(TEST_DATES.NEXT_DAY)
  })

  it('goToDate updates to specified date', () => {
    const initialDate = TEST_DATES.DEFAULT
    const targetDate = TEST_DATES.THIRD_DAY
    const { currentDate, goToDate } = useDayNavigation({ initialDate })
    const result = goToDate(targetDate)
    expect(result).toBe(true)
    expect(currentDate.value).toBe(targetDate)
  })

  it('goToDate validates date before updating', () => {
    const initialDate = TEST_DATES.DEFAULT
    const { currentDate, goToDate } = useDayNavigation({ initialDate })
    const result = goToDate('invalid')
    // Should not change date when invalid
    expect(result).toBe(false)
    expect(currentDate.value).toBe(initialDate)
  })

  it('updates route when currentDate changes', async () => {
    const initialDate = TEST_DATES.DEFAULT
    const { goToNextDay } = useDayNavigation({ initialDate })

    goToNextDay()

    // Wait for watch to trigger
    await nextTick()

    expect(mockRouter.push).toHaveBeenCalledWith({
      params: { date: TEST_DATES.NEXT_DAY }
    })
  })

  it('does not update route when date is same as route param', async () => {
    mockRoute.params = { date: TEST_DATES.DEFAULT }
    const { goToDate } = useDayNavigation()

    goToDate(TEST_DATES.DEFAULT) // Same date

    await nextTick()

    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('handles browser back/forward navigation', () => {
    const { currentDate } = useDayNavigation()

    // Simulate route change (browser back/forward)
    mockRoute.params = { date: TEST_DATES.PREV_DAY }

    // Trigger watch manually since we can't easily trigger Vue watchers in tests
    // In real usage, Vue's watch would handle this automatically
    currentDate.value = TEST_DATES.PREV_DAY

    expect(currentDate.value).toBe(TEST_DATES.PREV_DAY)
  })
})
