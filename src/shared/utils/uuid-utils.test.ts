import { describe, expect, it } from 'vitest'

import { generateUUID } from './uuid-utils'

describe('generateUUID', () => {
  it('returns valid UUID v4 format', () => {
    const uuid = generateUUID()

    // UUID v4 regex pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // where x is any hexadecimal digit, y is 8, 9, a, or b
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    expect(uuid).toMatch(uuidV4Regex)
  })

  it('returns unique values across multiple calls', () => {
    const uuid1 = generateUUID()
    const uuid2 = generateUUID()
    const uuid3 = generateUUID()

    expect(uuid1).not.toBe(uuid2)
    expect(uuid1).not.toBe(uuid3)
    expect(uuid2).not.toBe(uuid3)
  })
})
