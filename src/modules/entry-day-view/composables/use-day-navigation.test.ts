import { nextTick, reactive } from 'vue'

import { TEST_DATES } from '@test/constants/dates'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDayNavigation } from './use-day-navigation'

// Mock vue-router
const mockRoute = reactive<{ params: Record<string, string> }>({
  params: {}
})

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
    const regex = /^(\d{4})-\d{2}-\d{2}$/
    const match = regex.exec(date)
    if (match === null) return false
    const year = Number(match[1])
    return year >= 1900 && year <= 2100
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

  it('isToday is true when currentDate is today', () => {
    const { isToday } = useDayNavigation({ initialDate: TEST_DATES.DEFAULT })
    expect(isToday.value).toBe(true)
  })

  it('isToday is false when currentDate is not today', () => {
    const { isToday } = useDayNavigation({ initialDate: TEST_DATES.PREV_DAY })
    expect(isToday.value).toBe(false)
  })

  it('goToToday navigates to today and updates isToday', () => {
    const { currentDate, goToToday, isToday } = useDayNavigation({
      initialDate: TEST_DATES.PREV_DAY
    })
    goToToday()
    expect(currentDate.value).toBe(TEST_DATES.DEFAULT)
    expect(isToday.value).toBe(true)
  })

  it('syncs a route change (browser back/forward) into currentDate without pushing the route again', async () => {
    const { currentDate } = useDayNavigation()

    mockRoute.params = { date: TEST_DATES.PREV_DAY }
    await nextTick()
    // The loop guard resets on the next microtask; let it run, then let the
    // currentDate watcher settle.
    await Promise.resolve()
    await nextTick()

    expect(currentDate.value).toBe(TEST_DATES.PREV_DAY)
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('pushes the route again for a user-driven change after a route sync', async () => {
    const { currentDate } = useDayNavigation()

    mockRoute.params = { date: TEST_DATES.PREV_DAY }
    await nextTick()
    await Promise.resolve()
    await nextTick()

    currentDate.value = TEST_DATES.THIRD_DAY
    await nextTick()

    expect(mockRouter.push).toHaveBeenCalledOnce()
  })

  it('stops at the last supported day instead of moving past it', () => {
    const { currentDate, goToNextDay } = useDayNavigation({
      initialDate: '2100-12-31'
    })

    goToNextDay()

    expect(currentDate.value).toBe('2100-12-31')
  })

  it('stops at the first supported day instead of moving past it', () => {
    const { currentDate, goToPrevDay } = useDayNavigation({
      initialDate: '1900-01-01'
    })

    goToPrevDay()

    expect(currentDate.value).toBe('1900-01-01')
  })

  it('returns to today when Back lands on an address with no date', async () => {
    mockRoute.params = { date: TEST_DATES.PREV_DAY }
    const { currentDate } = useDayNavigation()
    expect(currentDate.value).toBe(TEST_DATES.PREV_DAY)

    mockRoute.params = {}
    await nextTick()
    await Promise.resolve()
    await nextTick()

    expect(currentDate.value).toBe(TEST_DATES.DEFAULT)
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('treats an invalid date in the address as today', async () => {
    mockRoute.params = { date: TEST_DATES.PREV_DAY }
    const { currentDate } = useDayNavigation()

    mockRoute.params = { date: '9999-01-01' }
    await nextTick()
    await Promise.resolve()
    await nextTick()

    expect(currentDate.value).toBe(TEST_DATES.DEFAULT)
  })
})
