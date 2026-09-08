<script setup lang="ts">
/**
 * SearchPage
 *
 * Thin page wrapper for the search route.
 * Delegates all UI to SearchRoot module component.
 *
 * Route: /search
 */

import { SharedToast } from '@/shared/components'

import SearchRoot from '@/modules/search/components/SearchRoot.vue'
</script>

<template>
  <SearchRoot />

  <SharedToast />
</template>
