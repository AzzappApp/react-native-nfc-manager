import { useAppState } from './useAppState';

/**
 *
 * @returns true if the app is in foreground, false otherwise
 */
const useIsForeground = (): boolean => {
  return useAppState() === 'active';
};

export default useIsForeground;
