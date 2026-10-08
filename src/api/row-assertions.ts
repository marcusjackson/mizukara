/**
 * Row Assertions
 *
 * Runtime checks for the cells of a sql.js row. A mapper that reads a cell
 * with a bare `as string` hides a wrong column or a changed stored type until
 * some later code trusts the type; these fail where the bad value was read.
 */

/**
 * Assert and return a string value from a sql.js row cell.
 *
 * @param v - The raw cell value from a sql.js row
 * @param col - Column name (used in error message)
 * @param mapper - Name of the mapper reading the cell (used in error message)
 * @returns The value as a string
 * @throws {TypeError} If the value is not a string
 */
export function assertString(v: unknown, col: string, mapper: string): string {
  if (typeof v !== 'string')
    throw new TypeError(
      `${mapper}: column "${col}" expected string, got ${typeof v}`
    )
  return v
}

/**
 * Assert and return a number value from a sql.js row cell.
 *
 * @param v - The raw cell value from a sql.js row
 * @param col - Column name (used in error message)
 * @param mapper - Name of the mapper reading the cell (used in error message)
 * @returns The value as a number
 * @throws {TypeError} If the value is not a number
 */
export function assertNumber(v: unknown, col: string, mapper: string): number {
  if (typeof v !== 'number')
    throw new TypeError(
      `${mapper}: column "${col}" expected number, got ${typeof v}`
    )
  return v
}
