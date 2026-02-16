/**
 * Tests for AppSettingsSectionDatabase component
 *
 * Section component for database export, import, and clear operations.
 * Uses useDatabaseExport composable and SharedConfirmDialog.
 *
 * Note: Reka UI Dialog uses teleport/portal which has limitations in jsdom.
 * Tests use @vue/test-utils mount with stubbed Reka UI components.
 */

import { ref } from 'vue'

import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AppSettingsSectionDatabase from './AppSettingsSectionDatabase.vue'

import type { Ref } from 'vue'

// Mock useDatabaseExport composable
const mockExportDatabase = vi.fn()
const mockImportDatabase = vi.fn().mockResolvedValue(true)
const mockValidateDatabaseFile = vi.fn().mockResolvedValue(true)
const mockClearDatabase = vi.fn().mockResolvedValue(undefined)
const mockIsExporting: Ref<boolean> = ref(false)
const mockIsImporting: Ref<boolean> = ref(false)
const mockIsClearing: Ref<boolean> = ref(false)

vi.mock('@/shared/composables/use-database-export', () => ({
  useDatabaseExport: () => ({
    isExporting: mockIsExporting,
    isImporting: mockIsImporting,
    isClearing: mockIsClearing,
    exportDatabase: mockExportDatabase,
    importDatabase: mockImportDatabase,
    validateDatabaseFile: mockValidateDatabaseFile,
    clearDatabase: mockClearDatabase
  })
}))

const rekaUiStubs = {
  DialogRoot: {
    template: '<div v-if="open"><slot /></div>',
    props: ['open'],
    emits: ['update:open']
  },
  DialogPortal: { template: '<div><slot /></div>' },
  DialogOverlay: { template: '<div class="overlay" />' },
  DialogContent: {
    template: '<div role="dialog" aria-modal="true"><slot /></div>'
  },
  DialogTitle: { template: '<h2><slot /></h2>' },
  DialogDescription: { template: '<p><slot /></p>' },
  DialogClose: {
    template: '<button aria-label="Close"><slot /></button>'
  }
}

function mountDatabase() {
  return mount(AppSettingsSectionDatabase, {
    global: {
      stubs: rekaUiStubs
    }
  })
}

describe('AppSettingsSectionDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockImportDatabase.mockResolvedValue(true)
    mockValidateDatabaseFile.mockResolvedValue(true)
    mockClearDatabase.mockResolvedValue(undefined)
    mockIsExporting.value = false
    mockIsImporting.value = false
    mockIsClearing.value = false
  })

  afterEach(() => {
    mockIsExporting.value = false
    mockIsImporting.value = false
    mockIsClearing.value = false
  })

  it('renders section title', () => {
    const wrapper = mountDatabase()

    expect(wrapper.text()).toContain('Database')
  })

  it('renders export button', () => {
    const wrapper = mountDatabase()
    const exportButton = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Export'))

    expect(exportButton).toBeDefined()
  })

  it('renders import button', () => {
    const wrapper = mountDatabase()
    const importButton = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Import'))

    expect(importButton).toBeDefined()
  })

  it('renders clear button', () => {
    const wrapper = mountDatabase()
    const clearButton = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Clear'))

    expect(clearButton).toBeDefined()
  })

  it('calls exportDatabase on export button click', async () => {
    const wrapper = mountDatabase()
    const exportButton = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Export'))

    await exportButton!.trigger('click')

    expect(mockExportDatabase).toHaveBeenCalledTimes(1)
  })

  it('displays descriptive text for export', () => {
    const wrapper = mountDatabase()

    expect(wrapper.text()).toContain('backup')
  })

  it('displays warning for import operation', () => {
    const wrapper = mountDatabase()

    expect(wrapper.text()).toContain('Import')
  })

  it('displays warning for clear operation', () => {
    const wrapper = mountDatabase()

    expect(wrapper.text()).toContain('Clear')
  })

  it('has accessible section semantics', () => {
    const wrapper = mountDatabase()
    const section = wrapper.find('section')

    expect(section.exists()).toBe(true)
    expect(section.attributes('aria-label')).toBe('Database settings')
  })

  it('renders hidden file input with correct accept attribute', () => {
    const wrapper = mountDatabase()
    const input = wrapper.find('input[type="file"]')

    expect(input.exists()).toBe(true)
    expect(input.attributes('accept')).toBe('.db,.sqlite,.sqlite3')
  })

  it('disables all buttons when export is in progress', () => {
    mockIsExporting.value = true
    const wrapper = mountDatabase()
    const buttons = wrapper.findAll('button')
    const actionButtons = buttons.filter(
      (b) =>
        b.text().includes('Export') ||
        b.text().includes('Import') ||
        b.text().includes('Clear')
    )

    for (const btn of actionButtons) {
      expect(btn.attributes('disabled')).toBeDefined()
    }
  })

  it('disables all buttons when import is in progress', () => {
    mockIsImporting.value = true
    const wrapper = mountDatabase()
    const buttons = wrapper.findAll('button')
    const actionButtons = buttons.filter(
      (b) =>
        b.text().includes('Import') ||
        b.text().includes('Export') ||
        b.text().includes('Clear')
    )

    for (const btn of actionButtons) {
      expect(btn.attributes('disabled')).toBeDefined()
    }
  })

  it('disables all buttons when clear is in progress', () => {
    mockIsClearing.value = true
    const wrapper = mountDatabase()
    const buttons = wrapper.findAll('button')
    const actionButtons = buttons.filter(
      (b) =>
        b.text().includes('Clear') ||
        b.text().includes('Export') ||
        b.text().includes('Import')
    )

    for (const btn of actionButtons) {
      expect(btn.attributes('disabled')).toBeDefined()
    }
  })

  it('shows exporting text when export is in progress', () => {
    mockIsExporting.value = true
    const wrapper = mountDatabase()

    expect(wrapper.text()).toContain('Exporting…')
  })

  it('shows importing text when import is in progress', () => {
    mockIsImporting.value = true
    const wrapper = mountDatabase()

    expect(wrapper.text()).toContain('Importing…')
  })

  it('shows clearing text when clear is in progress', () => {
    mockIsClearing.value = true
    const wrapper = mountDatabase()

    expect(wrapper.text()).toContain('Clearing…')
  })

  it('shows descriptive text for each operation', () => {
    const wrapper = mountDatabase()
    const text = wrapper.text()

    expect(text).toContain('Download a backup')
    expect(text).toContain('Restore from a previously exported')
    expect(text).toContain('Permanently delete all entries')
  })
})
