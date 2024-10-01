/**
 * Creates a random id, non-guaranteed to be unique but good enough for simple
 * purposes, like screen id generation.
 *
 * @returns the random id
 */
export const createId = () => Math.random().toString(16).slice(2);

export const keyExtractor = <ItemT extends { id: string } | null>(
  item: ItemT,
  index: number,
) => item?.id ?? `${index}`;
