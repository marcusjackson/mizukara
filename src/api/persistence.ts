/**
 * Persistence Utilities
 *
 * Utilities for auto-persisting database changes.
 * Wraps mutation operations to automatically save to IndexedDB.
 */

import { schedulePersist } from '@/db/indexeddb'

interface WithAutoPersistOptions {
  additionalMethods?: string[]
}

/**
 * Wrapper that auto-persists after mutation operations
 *
 * @param repository - Repository object to wrap
 * @param options - Configuration options
 * @returns Proxy of repository with auto-persistence
 * @example
 * const repository = withAutoPersist({
 *   create: (input) => { ... },
 *   update: (id, input) => { ... },
 *   remove: (id) => { ... }
 * })
 */
export function withAutoPersist<T extends Record<string, unknown>>(
  repository: T,
  options: WithAutoPersistOptions = {}
): T {
  const defaultMethods = [
    'create',
    'update',
    'remove',
    'reorder',
    'updateField'
  ]
  const mutationMethods = [
    ...defaultMethods,
    ...(options.additionalMethods ?? [])
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
 * Checks if method name is in list of intercepted methods:
 * create, update, remove, reorder, updateField.
 *
 * @param _target - Target object
 * @param _propertyKey - Method name
 * @param descriptor - Property descriptor
 * @returns Decorated property descriptor
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
