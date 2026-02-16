<script setup lang="ts">
/**
 * AppSettingsSectionDatabase
 *
 * Section component for database export, import, and clear operations.
 * Uses useDatabaseExport composable for all database operations.
 * Shows confirmation dialogs before import and clear.
 */

import { computed, ref } from 'vue'

import { BaseButton } from '@/base/components'

import SharedConfirmDialog from '@/shared/components/SharedConfirmDialog.vue'
import { useDatabaseExport } from '@/shared/composables/use-database-export'

const {
  clearDatabase,
  exportDatabase,
  importDatabase,
  isClearing,
  isExporting,
  isImporting,
  validateDatabaseFile
} = useDatabaseExport()

const showImportDialog = ref(false)
const showClearDialog = ref(false)
const pendingImportFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const isAnyOperationInProgress = computed(
  () => isExporting.value || isImporting.value || isClearing.value
)

function handleExport(): void {
  exportDatabase()
}

function handleImportClick(): void {
  fileInputRef.value?.click()
}

async function handleFileSelected(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const isValid = await validateDatabaseFile(file)
  if (!isValid) {
    return
  }

  pendingImportFile.value = file
  showImportDialog.value = true

  // Reset file input so same file can be re-selected
  target.value = ''
}

async function handleConfirmImport(): Promise<void> {
  if (!pendingImportFile.value) return

  const success = await importDatabase(pendingImportFile.value)
  showImportDialog.value = false
  pendingImportFile.value = null

  if (success) {
    globalThis.location.reload()
  }
}

function handleCancelImport(): void {
  showImportDialog.value = false
  pendingImportFile.value = null
}

function handleClearClick(): void {
  showClearDialog.value = true
}

async function handleConfirmClear(): Promise<void> {
  await clearDatabase()
  showClearDialog.value = false
  globalThis.location.reload()
}

function handleCancelClear(): void {
  showClearDialog.value = false
}
</script>

<template>
  <section
    aria-label="Database settings"
    class="app-settings-section"
  >
    <h2 class="app-settings-section-title">Database</h2>

    <div class="app-settings-db-operation">
      <div class="app-settings-db-operation-info">
        <span class="app-settings-db-operation-label">Export</span>
        <span class="app-settings-db-operation-description">
          Download a backup of your entire database
        </span>
      </div>
      <BaseButton
        :disabled="isAnyOperationInProgress"
        :loading="isExporting"
        variant="secondary"
        @click="handleExport"
      >
        {{ isExporting ? 'Exporting…' : 'Export Database' }}
      </BaseButton>
    </div>

    <div class="app-settings-db-operation">
      <div class="app-settings-db-operation-info">
        <span class="app-settings-db-operation-label">Import</span>
        <span class="app-settings-db-operation-description">
          Restore from a previously exported backup file
        </span>
      </div>
      <BaseButton
        :disabled="isAnyOperationInProgress"
        :loading="isImporting"
        variant="secondary"
        @click="handleImportClick"
      >
        {{ isImporting ? 'Importing…' : 'Import Database' }}
      </BaseButton>
      <input
        ref="fileInputRef"
        accept=".db,.sqlite,.sqlite3"
        aria-label="Select database file to import"
        class="app-settings-file-input"
        type="file"
        @change="handleFileSelected"
      />
    </div>

    <div class="app-settings-db-operation">
      <div class="app-settings-db-operation-info">
        <span class="app-settings-db-operation-label">Clear All Data</span>
        <span class="app-settings-db-operation-description">
          Permanently delete all entries from the database
        </span>
      </div>
      <BaseButton
        :disabled="isAnyOperationInProgress"
        :loading="isClearing"
        variant="danger"
        @click="handleClearClick"
      >
        {{ isClearing ? 'Clearing…' : 'Clear Database' }}
      </BaseButton>
    </div>

    <SharedConfirmDialog
      v-model:open="showImportDialog"
      confirm-label="Import"
      description="Importing a database will replace all current data. Consider exporting a backup first."
      :loading="isImporting"
      title="Import database?"
      @cancel="handleCancelImport"
      @confirm="handleConfirmImport"
    />

    <SharedConfirmDialog
      v-model:open="showClearDialog"
      confirm-label="Clear All Data"
      description="This action is destructive and irreversible. All your journal entries will be permanently deleted."
      :loading="isClearing"
      title="Clear all data?"
      variant="danger"
      @cancel="handleCancelClear"
      @confirm="handleConfirmClear"
    />
  </section>
</template>

<style scoped>
.app-settings-section {
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.app-settings-section-title {
  margin: 0 0 var(--spacing-lg);
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.app-settings-db-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 44px;
  padding: var(--spacing-3) 0;
}

.app-settings-db-operation + .app-settings-db-operation {
  border-top: 1px solid var(--color-border);
}

.app-settings-db-operation-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.app-settings-db-operation-label {
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.app-settings-db-operation-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.app-settings-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  border: 0;
  white-space: nowrap;
  clip-path: inset(50%);
}

@media (width <= 767px) {
  .app-settings-db-operation {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-3);
  }
}
</style>
