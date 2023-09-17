import * as React from 'react';
import {
  useCurrentRoute,
  useRouter,
  useScreenHasFocus,
} from '#components/NativeRouter';

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
type EffectCallback = () => (() => void) | undefined | void;

/**
 * Hook to run an effect in a focused screen, similar to `React.useEffect`.
 * This can be used to perform side-effects such as fetching data or subscribing to events.
 * The passed callback should be wrapped in `React.useCallback` to avoid running the effect too often.
 *
 * @param callback Memoized callback containing the effect, should optionally return a cleanup function.
 */
export function useFocusEffect(effect: EffectCallback) {
  const router = useRouter();
  const hasFocus = useScreenHasFocus();
  const route = useCurrentRoute();

  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    let cleanup: (() => void) | undefined | void;

    const callback = () => {
      const destroy = effect();

      if (destroy === undefined || typeof destroy === 'function') {
        return destroy;
      }

      if (process.env.NODE_ENV !== 'production') {
        let message =
          'An effect function must not return anything besides a function, which is used for clean-up.';

        if (destroy === null) {
          message +=
            " You returned 'null'. If your effect does not require clean-up, return 'undefined' (or nothing).";
        } else if (typeof (destroy as any).then === 'function') {
          message +=
            "\n\nIt looks like you wrote 'useFocusEffect(async () => ...)' or returned a Promise. " +
            'Instead, write the async function inside your effect ' +
            'and call it immediately:\n\n' +
            'useFocusEffect(\n' +
            '  React.useCallback(() => {\n' +
            '    async function fetchData() {\n' +
            '      // You can await here\n' +
            '      const response = await MyAPI.getData(someId);\n' +
            '      // ...\n' +
            '    }\n\n' +
            '    fetchData();\n' +
            '  }, [someId])\n' +
            ');\n\n' +
            'See usage guide: https://reactnavigation.org/docs/use-focus-effect';
        } else {
          message += ` You returned '${JSON.stringify(destroy)}'.`;
        }

        console.error(message);
      }
    };

    // We need to run the effect on intial render/dep changes if the screen is focused
    if (hasFocus) {
      cleanup = callback();
    }

    const unsubscribeBlur = router.addRouteWillChangeListener(() => {
      if (cleanup !== undefined) {
        cleanup();
      }

      cleanup = undefined;
    });

    return () => {
      if (cleanup !== undefined) {
        cleanup();
      }

      unsubscribeBlur.dispose();
    };
  }, [effect, hasFocus, route, router]);
}
