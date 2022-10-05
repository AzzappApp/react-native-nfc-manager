import { createContext } from 'react';

export type SearchScreenContextState = {
  search: string | undefined;
  activeRoute: string;
};
const SearchScreenContext = createContext<SearchScreenContextState>({
  search: undefined,
  activeRoute: '',
});
export default SearchScreenContext;
