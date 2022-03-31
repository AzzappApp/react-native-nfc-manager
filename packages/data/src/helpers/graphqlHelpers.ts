import type { Connection } from 'graphql-relay';

type BookmarkedListResult<T> = {
  rows: Array<{
    key: string;
    doc: T;
  }>;
  bookmark: string | null;
};

export const forwardConnectionFromBookmarkedListResult = <T>(
  expectedSize: number,
  bookmarkedResult: BookmarkedListResult<T>,
): Connection<T> => ({
  pageInfo: {
    hasPreviousPage: false,
    hasNextPage: expectedSize === bookmarkedResult.rows.length,
    startCursor: null,
    endCursor: bookmarkedResult.bookmark,
  },
  edges: bookmarkedResult.rows.map(({ key, doc }) => ({
    cursor: key,
    node: doc,
  })),
});

export const emptyConnection: Connection<any> = {
  pageInfo: {
    hasPreviousPage: false,
    hasNextPage: false,
    startCursor: null,
    endCursor: null,
  },
  edges: [],
};
