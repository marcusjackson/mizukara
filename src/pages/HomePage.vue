<script setup lang="ts">
/**
 * HomePage
 *
 * Pure redirect component that navigates to /entries on mount.
 * Uses router.replace to avoid creating a history entry.
 *
 * Route: /
 * Redirect: /entries (entry day view defaults to today)
 */

import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(async () => {
  await router.replace('/entries')
})
</script>

<template>
  <!-- No UI: pure redirect to /entries on mount -->
  <div></div>
</template>
