/**
 * Responsive Breakpoint Constants
 *
 * Standard breakpoints for responsive design across the application.
 * Mobile-first approach: all values are min-widths. Default styles target mobile.
 * Use `>= BREAKPOINTS.tablet` for tablet-and-up, `>= BREAKPOINTS.desktop` for desktop-and-up.
 *
 * @example
 * ```typescript
 * import { BREAKPOINTS } from '@/shared/utils/breakpoints'
 *
 * const isDesktop = computed(() => windowWidth.value >= BREAKPOINTS.desktop)
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
  /** Tablet min-width: 768px+ */
  tablet: 768,
  /** Desktop min-width: 1024px+ */
  desktop: 1024
} as const

export type Breakpoint = keyof typeof BREAKPOINTS
