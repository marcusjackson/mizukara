<script setup lang="ts">
/**
 * EntryDayViewEntryEditorTagSuggestions
 *
 * The "Suggest tags" action and the chips it produces: the top five, with a
 * way to reveal up to ten. Every chip is a tag the person already has.
 *
 * Owns no mutations. A chip click emits upward, so applying a suggestion goes
 * through the same path as typing a tag by hand. An applied chip drops out of
 * the list and the rest stay, so several can be taken in a row.
 */

import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import { BaseButton } from '@/base/components'

import { useTagSuggestions } from '@/modules/local-inference/composables/use-tag-suggestions'
import { ROUTES } from '@/router/routes'

import type { TagInputOption } from '@/shared/types/tag-types'

const props = defineProps<{
  /** The entry's current text, including edits not yet saved. */
  entryText: string
  vocabulary: TagInputOption[]
  assignedTagIds: string[]
}>()

const emit = defineEmits<{
  'apply-existing': [tagId: string]
}>()

/** How many suggestions show before "Show more". */
const INITIAL_COUNT = 5

const { clear, error, isWorking, suggest, suggestions } = useTagSuggestions()

const hasText = computed(() => props.entryText.trim().length > 0)

/**
 * Whether suggestions have been asked for yet.
 *
 * Without this the live region announces "nothing to suggest" the moment the
 * editor opens, before anyone has asked for anything.
 */
const hasSuggested = ref(false)
const isExpanded = ref(false)
const suggestButton = ref<InstanceType<typeof BaseButton> | null>(null)

/** Suggestions not yet on the entry; an applied one leaves the list. */
const remaining = computed(() =>
  suggestions.value.filter((s) => !props.assignedTagIds.includes(s.tagId))
)

const visibleSuggestions = computed(() =>
  isExpanded.value ? remaining.value : remaining.value.slice(0, INITIAL_COUNT)
)
const hiddenCount = computed(
  () => remaining.value.length - visibleSuggestions.value.length
)

/** Whether the run left nothing to offer: shown on screen, not only announced. */
const showsEmptyResult = computed(
  () => hasSuggested.value && !isWorking.value && remaining.value.length === 0
)

const status = computed(() => {
  const count = remaining.value.length
  if (count === 0) {
    if (suggestions.value.length > 0) return 'All suggested tags added.'
    return props.vocabulary.length === 0
      ? 'No tags to suggest yet: you have not created any tags.'
      : 'No tags to suggest for this entry.'
  }
  return count === 1 ? '1 tag suggested.' : `${String(count)} tags suggested.`
})

// Suggestions describe the text they were made from. Once that text changes
// they are stale, so they go rather than being applied to something else.
watch(
  () => props.entryText,
  () => {
    if (hasSuggested.value || isWorking.value) {
      hasSuggested.value = false
      clear()
    }
  }
)

async function handleSuggest(): Promise<void> {
  isExpanded.value = false
  const askedAbout = props.entryText
  await suggest(askedAbout, props.vocabulary, props.assignedTagIds)
  // A run cleared because the text changed under it must not read as done.
  hasSuggested.value = props.entryText === askedAbout
}

async function handleApply(tagId: string): Promise<void> {
  emit('apply-existing', tagId)
  // The clicked chip is about to leave the page; without this, focus falls
  // to the top of the document.
  await nextTick()
  if (remaining.value.length === 0) {
    ;(suggestButton.value?.$el as HTMLElement | undefined)?.focus()
  }
}
</script>

<template>
  <div class="entry-editor-tag-suggestions">
    <BaseButton
      ref="suggestButton"
      :aria-busy="isWorking"
      :disabled="!hasText || isWorking"
      size="sm"
      variant="ghost"
      @click="handleSuggest"
    >
      {{ isWorking ? 'Suggesting…' : 'Suggest tags' }}
    </BaseButton>

    <p
      aria-live="polite"
      class="entry-editor-tag-suggestions-status"
    >
      <span v-if="hasSuggested && !isWorking">
        {{ status }}
      </span>
    </p>

    <!-- The live region above announces this; the text here is for the eye. -->
    <p
      v-if="showsEmptyResult"
      class="entry-editor-tag-suggestions-notice"
    >
      <span aria-hidden="true">{{ status }}</span>
      <RouterLink
        v-if="vocabulary.length === 0"
        class="entry-editor-tag-suggestions-link"
        :to="ROUTES.TAGS"
      >
        Add some starter tags
      </RouterLink>
    </p>

    <p
      v-if="error"
      class="entry-editor-tag-suggestions-notice"
      role="status"
    >
      {{ error }}
    </p>

    <ul
      v-if="remaining.length > 0"
      class="entry-editor-tag-suggestions-list"
    >
      <li
        v-for="suggestion in visibleSuggestions"
        :key="suggestion.tagId"
      >
        <button
          class="entry-editor-tag-suggestions-chip"
          type="button"
          @click="handleApply(suggestion.tagId)"
        >
          Add {{ suggestion.name }}
        </button>
      </li>
    </ul>

    <BaseButton
      v-if="hiddenCount > 0"
      size="sm"
      variant="ghost"
      @click="isExpanded = true"
    >
      Show {{ hiddenCount }} more
    </BaseButton>
  </div>
</template>

<style scoped>
.entry-editor-tag-suggestions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  margin-top: var(--spacing-2);
}

.entry-editor-tag-suggestions-status {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.entry-editor-tag-suggestions-notice {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.entry-editor-tag-suggestions-link {
  color: var(--color-primary);
}

.entry-editor-tag-suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.entry-editor-tag-suggestions-chip {
  min-height: 44px;
  padding: var(--spacing-1) var(--spacing-3);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-full);
  background: none;
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.entry-editor-tag-suggestions-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-text-primary);
}

.entry-editor-tag-suggestions-chip:focus-visible {
  box-shadow: var(--focus-ring);
  outline: none;
}

@media (prefers-reduced-motion: reduce) {
  .entry-editor-tag-suggestions-chip {
    transition: none;
  }
}
</style>
