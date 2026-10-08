<script setup lang="ts">
/**
 * TagsSectionStarter
 *
 * Starter tags a person can take: the catalog, grouped by area of life.
 * Adding a group, or a single tag, creates ordinary tags they can rename or
 * delete. The model that suggests tags knows these names, so tags added here
 * get meaning-based suggestions.
 *
 * @emits tags-added - Tags were created; the list should be reloaded
 */

import { computed, ref } from 'vue'

import { BaseButton } from '@/base/components'

import { useStarterTags } from '../composables/use-starter-tags'

import type { TagWithCount } from '@/shared/types/tag-types'

const props = defineProps<{
  /** Every tag that exists, to show which starter tags are already added */
  tags: TagWithCount[]
}>()

const emit = defineEmits<{
  'tags-added': []
}>()

const { addTags, groups, isAdding } = useStarterTags(() => props.tags)
const isOpen = ref(false)
const allMissing = computed(() => groups.value.flatMap((g) => g.missing))

async function handleAdd(names: readonly string[]): Promise<void> {
  if ((await addTags(names)) > 0) emit('tags-added')
}
</script>

<template>
  <section
    aria-label="Starter tags"
    class="tags-section-starter"
  >
    <BaseButton
      aria-controls="tags-section-starter-groups"
      :aria-expanded="isOpen"
      class="tags-section-starter__target"
      size="sm"
      variant="ghost"
      @click="isOpen = !isOpen"
    >
      {{ isOpen ? 'Hide starter tags' : 'Add starter tags' }}
    </BaseButton>

    <div
      v-if="isOpen"
      id="tags-section-starter-groups"
      class="tags-section-starter__groups"
    >
      <p class="tags-section-starter__hint">
        Tags you add are yours to rename or delete. Tags with these names get
        suggestions from the on-device model.
      </p>

      <BaseButton
        class="tags-section-starter__target"
        :disabled="isAdding || allMissing.length === 0"
        size="sm"
        variant="secondary"
        @click="handleAdd(allMissing)"
      >
        {{
          allMissing.length > 0
            ? `Add all ${allMissing.length} starter tags`
            : 'All starter tags added'
        }}
      </BaseButton>

      <div
        v-for="group in groups"
        :key="group.title"
        class="tags-section-starter__group"
      >
        <div class="tags-section-starter__group-header">
          <h3 class="tags-section-starter__group-title">{{ group.title }}</h3>
          <!-- Kept (disabled) once the group is complete, so a keyboard user
               who just pressed it does not lose their place. -->
          <BaseButton
            :aria-label="
              group.missing.length > 0
                ? `Add ${group.missing.length} ${group.title} tags`
                : `All ${group.title} tags added`
            "
            class="tags-section-starter__target"
            :disabled="isAdding || group.missing.length === 0"
            size="sm"
            variant="secondary"
            @click="handleAdd(group.missing)"
          >
            {{
              group.missing.length > 0 ? `Add ${group.missing.length}` : 'Added'
            }}
          </BaseButton>
        </div>

        <ul class="tags-section-starter__list">
          <li
            v-for="tag in group.tags"
            :key="tag.name"
          >
            <button
              :aria-disabled="tag.isAdded"
              class="tags-section-starter__chip"
              :class="{ 'tags-section-starter__chip--added': tag.isAdded }"
              :disabled="isAdding"
              type="button"
              @click="!tag.isAdded && handleAdd([tag.name])"
            >
              {{ tag.isAdded ? `${tag.name} (added)` : `Add ${tag.name}` }}
            </button>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tags-section-starter {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.tags-section-starter__groups {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  width: 100%;
}

.tags-section-starter__hint {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.tags-section-starter__group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.tags-section-starter__group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
}

.tags-section-starter__group-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.tags-section-starter__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin: 0;
  padding: 0;
  list-style: none;
}

.tags-section-starter__chip {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: var(--spacing-xs) var(--spacing-md);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-full);
  background: none;
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: var(--font-size-sm);
}

.tags-section-starter__target {
  min-height: 44px;
}

button.tags-section-starter__chip {
  cursor: pointer;
}

button.tags-section-starter__chip:disabled {
  opacity: 0.6;
  cursor: default;
}

button.tags-section-starter__chip:hover:not(
    :disabled,
    .tags-section-starter__chip--added
  ) {
  border-color: var(--color-primary);
  color: var(--color-text-primary);
}

button.tags-section-starter__chip:focus-visible {
  box-shadow: var(--focus-ring);
  outline: none;
}

.tags-section-starter__chip--added {
  border-style: solid;
  color: var(--color-text-muted);
  cursor: default;
}
</style>
