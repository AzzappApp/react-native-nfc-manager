import { offsetToCursor, type Connection } from 'graphql-relay';

export const dateToCursor = (date: Date) =>
  Buffer.from(date.toISOString()).toString('base64');

export const cursorToDate = (cursor: string) =>
  new Date(Buffer.from(cursor, 'base64').toString('ascii'));

export const connectionFromDateSortedItems = <Item>(
  entities: Item[],
  meta: {
    getDate: (entity: Item) => Date;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  },
): Connection<Item> => {
  const { hasPreviousPage, hasNextPage, getDate } = meta;

  const edges = entities.map(entity => ({
    cursor: dateToCursor(getDate(entity)),
    node: entity,
  }));

  return {
    edges,
    pageInfo: {
      startCursor: edges[0]?.cursor ?? null,
      endCursor: edges[edges.length - 1]?.cursor ?? null,
      hasPreviousPage,
      hasNextPage,
    },
  };
};

export const emptyConnection = {
  edges: [],
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null,
    endCursor: null,
  },
};

export const connectionFromSortedArray = <Item>(
  entities: Item[],
  meta: {
    offset: number;
    hasNextPage: boolean;
  },
): Connection<Item> => {
  const { hasNextPage, offset } = meta;
  const edges = entities.map((entity, index) => ({
    cursor: offsetToCursor(offset + index),
    node: entity,
  }));

  return {
    edges,
    pageInfo: {
      startCursor: edges[0]?.cursor ?? null,
      endCursor: edges[edges.length - 1]?.cursor ?? null,
      hasPreviousPage: offset != null && offset > 0,
      hasNextPage,
    },
  };
};
