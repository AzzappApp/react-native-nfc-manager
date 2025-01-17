import { AppState } from 'react-native';
import type { AppStateStatus, NativeEventSubscription } from 'react-native';

/**
 * Helper async function to allow waiting for app to become active.
 * @returns true
 */
export const waitForAppState = async (targetStatus: AppStateStatus) => {
  return new Promise(resolve => {
    let subscription: NativeEventSubscription | undefined = undefined;
    const checkAppState = (nextAppState: AppStateStatus) => {
      if (nextAppState === targetStatus) {
        subscription?.remove(); // Clean up listener
        resolve(true); // Resolve the promise
      }
    };
    if (AppState.currentState === targetStatus) {
      // If already active, resolve immediately
      resolve(true);
    } else {
      // Add listener to wait for 'active' state
      subscription = AppState.addEventListener('change', checkAppState);
    }
  });
};
