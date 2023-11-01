import { createContext } from 'react';

export const PostListContext = createContext<{
  played: string | null;
  paused: string[];
}>({
  played: null,
  paused: [],
});
