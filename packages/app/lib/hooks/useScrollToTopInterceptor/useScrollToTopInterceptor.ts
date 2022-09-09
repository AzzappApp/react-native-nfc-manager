import { useCallback, useEffect, useRef } from 'react';
import {
  findNodeHandle,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import type { ScrollView } from 'react-native';

const useScrollToTopInterceptor = (onScrollToTop: () => void): any => {
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

  const addListerner = useCallback((scrollView: ScrollView) => {
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

  return (scrollView: ScrollView) => {
    if (scrollView) {
      removeListener();
      addListerner(scrollView);
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
