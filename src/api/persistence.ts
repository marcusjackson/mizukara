/**
 * Persistence Utilities
 *
 * Utilities for auto-persisting database changes.
 * Wraps mutation operations to automatically save to IndexedDB.
 */

import { schedulePersist } from '@/db/indexeddb'

/**
 * Wrapper that auto-persists after mutation operations
 *
 * @example
 * const repository = withAutoPersist({
 *   create: (input) => { ... },
 *   update: (id, input) => { ... },
 *   remove: (id) => { ... }
 * })
 */
export function withAutoPersist<T extends Record<string, unknown>>(
  repository: T
): T {
  const mutationMethods = [
    'create',
    'update',
    'remove',
    'reorder',
    'updateField'
  ]

  return new Proxy(repository, {
    get(target, prop) {
      const value = target[prop as keyof T]

      if (
        typeof value === 'function' &&
        mutationMethods.includes(String(prop))
      ) {
        return (...args: unknown[]) => {
          const result = (value as (...args: unknown[]) => unknown).apply(
            target,
            args
          )
          // Schedule persistence (debounced)
          schedulePersist()
          return result
        }
      }

      return value
    }
  })
}

/**
 * Decorator for auto-persisting class methods
 *
 * @example
 * class KanjiRepository {
 *   @autoPersist
 *   create(input: CreateKanjiInput): Kanji { ... }
 * }
 */
export function autoPersist(
  _target: unknown,
  _propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value as (...args: unknown[]) => unknown

  descriptor.value = function (...args: unknown[]) {
    const result = originalMethod.apply(this, args)
    // Schedule persistence (debounced)
    schedulePersist()
    return result
  }

  return descriptor
}
