import { createContext } from 'react';

export const PostListContext = createContext<{ visibleVideoPostIds: string[] }>(
  {
    visibleVideoPostIds: [],
  },
);
