import { useCallback, useEffect, useRef } from 'react';
import {
  findNodeHandle,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import type { UseseScrollToTopInterceptor } from './types';
import type { ScrollView } from 'react-native';

/**
 * iOS implementation of the useScrollToTopInterceptor hook
 */
const useScrollToTopInterceptor: UseseScrollToTopInterceptor =
  onScrollToTop => {
    const onScrollToTopRef = useRef(onScrollToTop);
    onScrollToTopRef.current = onScrollToTop;

    const interceptorIDRef = useRef<number | null>(null);

    useEffect(() => {
      const subscription = eventEmitter.addListener('onScrollToTop', data => {
        if (data?.interceptorID === interceptorIDRef.current) {
          onScrollToTopRef.current?.();
        }
      });
      return () => {
        subscription.remove();
        if (interceptorIDRef.current != null) {
          removeScrollToTopInterceptor(interceptorIDRef.current);
        }
      };
    }, []);

    const removeListener = useCallback(() => {
      if (interceptorIDRef.current != null) {
        removeScrollToTopInterceptor(interceptorIDRef.current);
      }
    }, []);

    const addListener = useCallback((scrollView: ScrollView) => {
      const nodeHandle = findNodeHandle(scrollView);
      if (nodeHandle == null) {
        return;
      }
      addScrollToTopInterceptor(nodeHandle).then(
        ({ interceptorID }) => {
          interceptorIDRef.current = interceptorID;
        },
        () => void 0,
      );
    }, []);

    return scrollView => {
      if (scrollView) {
        removeListener();
        addListener(scrollView);
      } else {
        removeListener();
      }
    };
  };

const eventEmitter = new NativeEventEmitter(
  NativeModules.AZPScrollToTopInterceptor,
);

const addScrollToTopInterceptor: (
  reactTag: number,
) => Promise<{ interceptorID: number }> =
  NativeModules.AZPScrollToTopInterceptor.addScrollToTopInterceptor;

const removeScrollToTopInterceptor: (interceptorID: number) => void =
  NativeModules.AZPScrollToTopInterceptor.removeScrollToTopInterceptor;

export default useScrollToTopInterceptor;
