<script setup lang="ts">
/**
 * TagsPage
 *
 * Thin page wrapper for the tags route.
 * Delegates all UI to TagsRoot module component.
 *
 * Route: /tags
 */

import { SharedToast } from '@/shared/components'

import TagsRoot from '@/modules/tags/components/TagsRoot.vue'
</script>

<template>
  <TagsRoot />

  <SharedToast />
</template>
