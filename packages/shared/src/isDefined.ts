/**
 * Helper function to ensure element are valid inside a list
 * [].filter(isDefined) will return an Array<Type> and not Array<Type | undefined> like filter(Boolean)
 */
export function isDefined<T>(value?: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
