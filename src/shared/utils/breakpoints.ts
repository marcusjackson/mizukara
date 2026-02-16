/**
 * Responsive Breakpoint Constants
 *
 * Standard breakpoints for responsive design across the application.
 * Mobile-first approach: default styles target mobile, use media queries for larger screens.
 *
 * @example
 * ```typescript
 * import { BREAKPOINTS } from '@/shared/utils/breakpoints'
 *
 * const isMobile = computed(() => windowWidth.value <= BREAKPOINTS.mobile)
 * ```
 *
 * @example
 * ```css
 * @media (width >= 768px) {
 *   // Tablet and up
 * }
 * ```
 */
export const BREAKPOINTS = {
  /** Mobile breakpoint: 0-767px */
  mobile: 767,
  /** Tablet breakpoint: 768-1023px */
  tablet: 1023,
  /** Desktop breakpoint: 1024px+ */
  desktop: 1024
} as const

export type Breakpoint = keyof typeof BREAKPOINTS
