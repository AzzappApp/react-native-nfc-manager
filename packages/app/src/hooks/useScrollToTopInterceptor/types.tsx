import type { ScrollView } from 'react-native';

export type UseseScrollToTopInterceptor = (
  onScrollToTop: () => void,
) => (scrollView: ScrollView | null) => void;
