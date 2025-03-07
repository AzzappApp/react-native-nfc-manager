import { renderHook, act } from '@testing-library/react-hooks';
import { Animated } from 'react-native';
import useIsModuleItemInViewPort from '../useIsModuleItemInViewPort';

// Mock Dimensions
jest.mock('react-native', () => ({
  Animated: {
    Value: jest.fn(() => ({
      __getValue: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
  },
}));

describe('useIsModuleItemInViewPort', () => {
  let scrollY: Animated.Value;
  let itemStartY: number;
  let componentheight: number;
  let isLayoutReady: boolean;
  let cancel: boolean;

  beforeEach(() => {
    scrollY = new Animated.Value(0) as unknown as Animated.Value;
    (scrollY as any).__getValue = jest.fn(); // Mock __getValue
    (scrollY as any).addListener = jest.fn(); // Mock addListener
    (scrollY as any).removeListener = jest.fn(); // Mock removeListener

    itemStartY = 100;
    componentheight = 200;
    isLayoutReady = true;
    cancel = false;
  });

  test('should return false if cancel is true', () => {
    cancel = true;
    const { result } = renderHook(() =>
      useIsModuleItemInViewPort(
        scrollY,
        itemStartY,
        componentheight,
        isLayoutReady,
        cancel,
        { width: 406, height: 800 },
      ),
    );
    expect(result.current).toBe(false);
  });

  test('should return true if the module is inside the viewport', () => {
    //@ts-expect-error - __getValue is private but we need it
    (scrollY.__getValue as jest.Mock).mockReturnValue(50); // Scroll position is 50
    const { result } = renderHook(() =>
      useIsModuleItemInViewPort(
        scrollY,
        itemStartY,
        componentheight,
        isLayoutReady,
        cancel,
        { width: 406, height: 800 },
      ),
    );
    expect(result.current).toBe(true);
  });

  test('should return false if the module is outside the viewport', () => {
    //@ts-expect-error - __getValue is private but we need it
    (scrollY.__getValue as jest.Mock).mockReturnValue(1000); // Scroll position is 1000
    const { result } = renderHook(() =>
      useIsModuleItemInViewPort(
        scrollY,
        itemStartY,
        componentheight,
        isLayoutReady,
        cancel,
        { width: 406, height: 800 },
      ),
    );
    expect(result.current).toBe(false);
  });

  test('should update isVisible when scrollY changes', () => {
    const { result } = renderHook(() =>
      useIsModuleItemInViewPort(
        scrollY,
        itemStartY,
        componentheight,
        isLayoutReady,
        cancel,
        { width: 406, height: 800 },
      ),
    );

    act(() => {
      const listener = (scrollY.addListener as jest.Mock).mock.calls[0][0];
      listener({ value: 50 }); // Simulate scrollY change to 50
    });

    expect(result.current).toBe(true);

    act(() => {
      const listener = (scrollY.addListener as jest.Mock).mock.calls[0][0];
      listener({ value: 1000 }); // Simulate scrollY change to 1000
    });

    expect(result.current).toBe(false);
  });

  test('should not update isVisible if isLayoutReady is false', () => {
    isLayoutReady = false;
    const { result } = renderHook(() =>
      useIsModuleItemInViewPort(
        scrollY,
        itemStartY,
        componentheight,
        isLayoutReady,
        cancel,
        { width: 406, height: 800 },
      ),
    );
    expect(result.current).toBe(false);
  });

  test('should remove the listener when unmounted', () => {
    const { unmount } = renderHook(() =>
      useIsModuleItemInViewPort(
        scrollY,
        itemStartY,
        componentheight,
        isLayoutReady,
        cancel,
        { width: 406, height: 800 },
      ),
    );

    unmount();

    expect(scrollY.removeListener).toHaveBeenCalledTimes(1);
  });
});
