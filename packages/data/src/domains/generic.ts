export const sortEntitiesByIds = <IDType, T extends { id: IDType }>(
  ids: readonly IDType[],
  entities: T[],
) => {
  const map = new Map(entities.map(entity => [entity.id, entity]));
  return ids.map(id => map.get(id) ?? null);
};
