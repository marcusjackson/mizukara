<script setup lang="ts">
/**
 * SharedToast
 *
 * Toast notification container built on Reka UI Toast primitives.
 * Renders toasts from the useToast composable.
 * Should be placed in the page layout to be globally available.
 */

import {
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastViewport
} from 'reka-ui'

import {
  DEFAULT_TOAST_DURATION,
  useToast
} from '@/shared/composables/use-toast'

import type { Toast } from '@/shared/composables/use-toast'

const { removeToast, toasts } = useToast()

function getToastClass(type: Toast['type']): string {
  return `base-toast base-toast-${type}`
}

function handleOpenChange(open: boolean, id: string): void {
  if (!open) {
    removeToast(id)
  }
}
</script>

<template>
  <ToastProvider :duration="DEFAULT_TOAST_DURATION">
    <ToastRoot
      v-for="toast in toasts"
      :key="toast.id"
      :class="getToastClass(toast.type)"
      :duration="toast.duration"
      @update:open="(open: boolean) => handleOpenChange(open, toast.id)"
    >
      <div class="base-toast-content">
        <div class="base-toast-icon">
          <!-- Success icon -->
          <svg
            v-if="toast.type === 'success'"
            aria-hidden="true"
            fill="none"
            height="20"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <!-- Error icon -->
          <svg
            v-else-if="toast.type === 'error'"
            aria-hidden="true"
            fill="none"
            height="20"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
            />
            <path d="m15 9-6 6M9 9l6 6" />
          </svg>
          <!-- Warning icon -->
          <svg
            v-else-if="toast.type === 'warning'"
            aria-hidden="true"
            fill="none"
            height="20"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <path
              d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
            />
          </svg>
          <!-- Info icon -->
          <svg
            v-else
            aria-hidden="true"
            fill="none"
            height="20"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
            />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </div>

        <div class="base-toast-text">
          <ToastTitle
            v-if="toast.title"
            class="base-toast-title"
          >
            {{ toast.title }}
          </ToastTitle>
          <ToastDescription class="base-toast-description">
            {{ toast.message }}
          </ToastDescription>
        </div>
      </div>

      <ToastClose
        aria-label="Close"
        class="base-toast-close"
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="16"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="16"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </ToastClose>
    </ToastRoot>

    <ToastViewport class="base-toast-viewport" />
  </ToastProvider>
</template>
