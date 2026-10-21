/**
 * Mock for virtual:pwa-register/vue
 *
 * This mock is used during testing since the virtual module is only
 * available in production builds with vite-plugin-pwa.
 */

import { ref } from 'vue';

import type { Ref } from 'vue';

export interface UseRegisterSWOptions {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
  onRegisterError?: (error: unknown) => void;
}

export interface UseRegisterSWReturn {
  needRefresh: Ref<boolean>;
  offlineReady: Ref<boolean>;
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
}

// Inert stand-ins; tests that need control mock the module themselves
const mockNeedRefresh = ref(false);
const mockOfflineReady = ref(false);
const mockUpdateServiceWorker = async (_reloadPage?: boolean): Promise<void> => {
  // No-op in tests
};

export function useRegisterSW(_options?: UseRegisterSWOptions): UseRegisterSWReturn {
  return {
    needRefresh: mockNeedRefresh,
    offlineReady: mockOfflineReady,
    updateServiceWorker: mockUpdateServiceWorker,
  };
}
