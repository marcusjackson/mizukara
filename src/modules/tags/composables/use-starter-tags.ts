/**
 * use-starter-tags
 *
 * Adopting the starter catalog: which catalog tags a person already has, and
 * creating the ones they pick. Adopting creates ordinary tags — nothing links
 * them to the catalog afterwards except sharing a name (ignoring case), the
 * rule tags already use to stay unique.
 */

import { computed, ref } from 'vue'

import { useToast } from '@/shared/composables/use-toast'

import catalog from '@/modules/local-inference/tag-catalog.json'

import { useTagMutations } from './use-tag-mutations'

import type { TagWithCount } from '@/shared/types/tag-types'
import type { ComputedRef, Ref } from 'vue'

export interface StarterTag {
  name: string
  /** Whether a tag with this name (ignoring case) already exists. */
  isAdded: boolean
}

export interface StarterGroup {
  title: string
  tags: StarterTag[]
  /** Tags in this group not yet added. */
  missing: string[]
}

export interface UseStarterTagsReturn {
  groups: ComputedRef<StarterGroup[]>
  isAdding: Readonly<Ref<boolean>>
  /**
   * Create the named catalog tags that do not exist yet.
   *
   * @returns How many were created. Failures show their own toast and do not
   *   stop the rest.
   */
  addTags: (names: readonly string[]) => Promise<number>
}

const CATALOG: Readonly<Record<string, readonly string[]>> = catalog

export function useStarterTags(
  existing: () => readonly TagWithCount[]
): UseStarterTagsReturn {
  const { createTag } = useTagMutations()
  const { success } = useToast()
  const isAdding = ref(false)

  const groups = computed<StarterGroup[]>(() => {
    const have = new Set(existing().map((tag) => tag.name.toLowerCase()))
    return Object.entries(CATALOG).map(([title, names]) => {
      const tags = names.map((name) => ({
        isAdded: have.has(name.toLowerCase()),
        name
      }))
      return {
        missing: tags.filter((t) => !t.isAdded).map((t) => t.name),
        tags,
        title
      }
    })
  })

  async function addTags(names: readonly string[]): Promise<number> {
    if (isAdding.value) return 0
    isAdding.value = true
    let created = 0
    try {
      const have = new Set(existing().map((tag) => tag.name.toLowerCase()))
      for (const name of names) {
        if (have.has(name.toLowerCase())) continue
        if ((await createTag(name)) !== null) created++
      }
    } finally {
      isAdding.value = false
    }
    if (created > 0) {
      success(created === 1 ? 'Added 1 tag' : `Added ${String(created)} tags`)
    }
    return created
  }

  return { addTags, groups, isAdding }
}
