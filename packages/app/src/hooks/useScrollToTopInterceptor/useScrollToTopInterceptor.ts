import type { UseseScrollToTopInterceptor } from './types';

/**
 * A hook to intercept the scroll to top event of a scroll view
 * iOS only
 *
 * @param onScrollToTop  A callback to be called when the scroll to top event is intercepted
 * @returns A function to be called on the ref of the scroll view
 */
const useScrollToTopInterceptor: UseseScrollToTopInterceptor = (
  _onScrollToTop: () => void,
): any => {
  return () => void 0;
};
export default useScrollToTopInterceptor;
