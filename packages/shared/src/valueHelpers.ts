export const firstNotUndefined = <T>(...values: T[]): T | undefined => {
  for (const value of values) {
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
};
