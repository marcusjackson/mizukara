<script setup lang="ts">
/**
 * BaseToast
 *
 * Toast notification container built on Reka UI Toast primitives.
 * Renders toasts from the useToast composable.
 * Should be placed in App.vue to be globally available.
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

<style scoped>
/* Scoped styles only apply to elements within this component's direct DOM */
</style>

<!-- 
  Global styles for Toast components rendered via Portal/Teleport.
  ToastViewport and ToastRoot are rendered outside the component tree,
  so scoped styles don't apply to them.
-->
<style>
.base-toast-viewport {
  position: fixed;
  top: calc(var(--spacing-lg) * 2);
  left: 50%;
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  width: 360px;
  max-width: calc(100vw - var(--spacing-lg) * 2);
  margin: 0;
  padding: 0;
  list-style: none;
  transform: translateX(-50%);
}

.base-toast {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-3);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-lg);
}

.base-toast-success {
  border-left: 4px solid var(--color-success);
}

.base-toast-error {
  border-left: 4px solid var(--color-error);
}

.base-toast-warning {
  border-left: 4px solid var(--color-warning);
}

.base-toast-info {
  border-left: 4px solid var(--color-info);
}

.base-toast-content {
  display: flex;
  flex: 1;
  gap: var(--spacing-3);
}

.base-toast-icon {
  flex-shrink: 0;
}

.base-toast-success .base-toast-icon {
  color: var(--color-success);
}

.base-toast-error .base-toast-icon {
  color: var(--color-error);
}

.base-toast-warning .base-toast-icon {
  color: var(--color-warning);
}

.base-toast-info .base-toast-icon {
  color: var(--color-info);
}

.base-toast-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--spacing-1);
  min-width: 0;
}

.base-toast-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.base-toast-description {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.base-toast-close {
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background-color: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.base-toast-close:hover {
  background-color: var(--color-background);
}

.base-toast-close:focus-visible {
  box-shadow: var(--focus-ring);
  outline: none;
}

/* Toast animations */
.base-toast[data-state='open'] {
  animation: toast-slide-down 200ms ease-out;
}

.base-toast[data-state='closed'] {
  animation: toast-slide-up 150ms ease-in;
}

@keyframes toast-slide-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toast-slide-up {
  from {
    opacity: 1;
    transform: translateY(0);
  }

  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}

/* Swipe gesture support */
.base-toast[data-swipe='move'] {
  transform: translateX(var(--reka-toast-swipe-move-x));
}

.base-toast[data-swipe='cancel'] {
  transition: transform 200ms ease-out;
  transform: translateX(0);
}

.base-toast[data-swipe='end'] {
  animation: toast-swipe-out 100ms ease-out;
}

@keyframes toast-swipe-out {
  from {
    transform: translateX(var(--reka-toast-swipe-end-x));
  }

  to {
    transform: translateX(100%);
  }
}
</style>
