<script setup lang="ts">
/**
 * EntryDayPage
 *
 * Thin page wrapper for entry day view route.
 * Extracts date from route parameter and delegates to root component.
 *
 * Route: /entries/:date?
 * - date parameter is optional
 * - Root defaults to today if date is missing or invalid
 *
 * @example
 * /entries → today's entries
 * /entries/2026-02-10 → entries for Feb 10, 2026
 */

import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { BaseToast } from '@/base/components'

import EntryDayViewRoot from '@/modules/entry-day-view/components/EntryDayViewRoot.vue'

const route = useRoute()

/**
 * Extract date parameter from route
 * Returns null if not provided (root will default to today)
 */
const initialDate = computed<string | null>(() => {
  const dateParam = route.params['date']
  return typeof dateParam === 'string' ? dateParam : null
})
</script>

<template>
  <EntryDayViewRoot :initial-date="initialDate" />

  <BaseToast />
</template>
