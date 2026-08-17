<script setup lang="ts">
/**
 * SettingsPage
 *
 * Thin page wrapper for settings route.
 * Delegates all UI to AppSettingsRoot module component.
 *
 * Route: /settings
 */

import { SharedToast } from '@/shared/components'

import AppSettingsRoot from '@/modules/app-settings/components/AppSettingsRoot.vue'
</script>

<template>
  <AppSettingsRoot />

  <SharedToast />
</template>
