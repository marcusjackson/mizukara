<script setup lang="ts">
/**
 * NotFoundPage
 *
 * Fallback page shown when no route matches.
 * Provides a link back to the home page.
 */
import { ROUTES } from '@/router/routes'
</script>

<template>
  <div class="not-found-page">
    <h1>Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <RouterLink
      class="not-found-home-link"
      :to="ROUTES.HOME"
      >Go to home</RouterLink
    >
  </div>
</template>

<style scoped>
.not-found-page {
  padding: var(--spacing-8);
  text-align: center;
}

.not-found-home-link {
  display: inline-block;
  margin-top: var(--spacing-4);
  color: var(--color-primary);
}
</style>
