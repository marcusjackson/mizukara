import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  addDays,
  getToday,
  isValidISODate,
  subtractDays
} from '@/shared/utils/date-utils'

import type { Ref } from 'vue'

/**
 * Options for useDayNavigation composable
 */
export interface UseDayNavigationOptions {
  /** Initial date as ISO string (YYYY-MM-DD) or null to use today */
  initialDate?: string | null
}

/**
 * Return type for useDayNavigation composable
 */
export interface UseDayNavigationReturn {
  /** Current selected date (ISO string YYYY-MM-DD) */
  currentDate: Ref<string>
  /** Navigate to the previous day */
  goToPrevDay: () => void
  /** Navigate to the next day */
  goToNextDay: () => void
  /** Navigate to a specific date, returns true if successful */
  goToDate: (date: string) => boolean
}

/**
 * Determine initial date with fallback priority
 *
 * Priority order:
 * 1. Route parameter (highest - respects deep links/bookmarks)
 * 2. Provided initialDate option
 * 3. Today's date (fallback)
 *
 * @param route - Vue Router route object
 * @param initialDate - Optional initial date (can be null to skip)
 * @returns Valid ISO date string (YYYY-MM-DD)
 */
function getInitialDate(
  route: ReturnType<typeof useRoute>,
  initialDate?: string | null
): string {
  // Check route param first
  const routeDate = route.params['date'] as string | undefined
  if (routeDate && isValidISODate(routeDate)) {
    return routeDate
  }

  // Then check provided initialDate
  if (initialDate && isValidISODate(initialDate)) {
    return initialDate
  }

  // Finally fallback to today
  return getToday()
}

/**
 * Day navigation composable for managing current date state and navigation
 *
 * Provides reactive date state with navigation functions and route synchronization.
 * Defaults to today if no valid initial date is provided.
 *
 * @param options - Configuration options
 * @returns Object with currentDate ref and navigation functions
 *
 * @example
 * const { currentDate, goToPrevDay, goToNextDay, goToDate } = useDayNavigation({
 *   initialDate: '2026-02-11'
 * })
 */
export function useDayNavigation(
  options: UseDayNavigationOptions = {}
): UseDayNavigationReturn {
  const { initialDate } = options
  const route = useRoute()
  const router = useRouter()

  const currentDate = ref<string>(getInitialDate(route, initialDate))

  // Track whether we're currently updating the route to prevent loops
  let isUpdatingRoute = false

  /**
   * Navigate to the previous day
   */
  function goToPrevDay(): void {
    currentDate.value = subtractDays(currentDate.value, 1)
  }

  /**
   * Navigate to the next day
   */
  function goToNextDay(): void {
    currentDate.value = addDays(currentDate.value, 1)
  }

  /**
   * Navigate to a specific date
   *
   * @param date - Target date as ISO string (YYYY-MM-DD)
   * @returns True if date was valid and navigation succeeded, false otherwise
   */
  function goToDate(date: string): boolean {
    if (isValidISODate(date)) {
      currentDate.value = date
      return true
    }
    return false
  }

  // Setup bidirectional sync between currentDate and route params
  setupDateRouteSync(
    currentDate,
    route,
    router,
    () => isUpdatingRoute,
    (value) => {
      isUpdatingRoute = value
    }
  )

  return {
    currentDate,
    goToPrevDay,
    goToNextDay,
    goToDate
  }
}

/**
 * Setup bidirectional synchronization between currentDate ref and route params
 *
 * @param currentDate - Reactive date ref to sync
 * @param route - Vue router route object
 * @param router - Vue router instance
 * @param getIsUpdating - Function to check if route is being updated
 * @param setIsUpdating - Function to set route updating flag
 */
function setupDateRouteSync(
  currentDate: Ref<string>,
  route: ReturnType<typeof useRoute>,
  router: ReturnType<typeof useRouter>,
  getIsUpdating: () => boolean,
  setIsUpdating: (value: boolean) => void
): void {
  /**
   * Watch currentDate and update route
   *
   * Guard: Skip if the change came from a route update to prevent loops
   */
  watch(currentDate, (newDate) => {
    if (getIsUpdating()) {
      // This change came from route watch, skip route update
      return
    }

    const currentRouteDate = route.params['date'] as string | undefined
    if (currentRouteDate !== newDate) {
      void router.push({ params: { ...route.params, date: newDate } })
    }
  })

  /**
   * Watch route changes and update currentDate
   *
   * Handles browser back/forward navigation by syncing route param to state.
   * Guard: Set flag to prevent the currentDate watch from re-updating the route.
   */
  watch(
    () => route.params['date'],
    (newRouteDate) => {
      if (
        newRouteDate &&
        isValidISODate(newRouteDate as string) &&
        newRouteDate !== currentDate.value
      ) {
        setIsUpdating(true)
        currentDate.value = newRouteDate as string
        // Reset flag on next tick after currentDate watch has run
        void Promise.resolve().then(() => {
          setIsUpdating(false)
        })
      }
    }
  )
}
