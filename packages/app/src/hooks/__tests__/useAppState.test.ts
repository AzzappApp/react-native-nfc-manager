import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useAppState } from '../useAppState';
import type { AppStateStatus } from 'react-native';

jest.mock('react-native', () => ({
  AppState: {
    currentState: 'mock-currentState',
    addEventListener: jest.fn(() => {
      return {
        remove: jest.fn(),
      };
    }),
    removeEventListener: jest.fn(),
  },
}));

describe('useAppState', () => {
  const addEventListenerMock = AppState.addEventListener as jest.Mock;
  const createEmitAppStateChange = () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    let listener: (newStatus: AppStateStatus) => {};

    addEventListenerMock.mockImplementationOnce((_, fn) => {
      listener = fn;

      return {
        remove: jest.fn(),
      };
    });

    return (newStatus: AppStateStatus) => listener(newStatus);
  };

  test('should return current state by default', () => {
    const { result } = renderHook(() => useAppState());

    expect(result.current).toBe(AppState.currentState);
  });

  test('should update state when it change', () => {
    const newStatus = 'background';
    const emit = createEmitAppStateChange();

    const { result } = renderHook(() => useAppState());

    const { current: initialStatus } = result;

    act(() => {
      emit(newStatus);
    });

    const { current: statusAfterUpdate } = result;

    expect({ initialStatus, statusAfterUpdate }).toEqual({
      initialStatus: AppState.currentState,
      statusAfterUpdate: newStatus,
    });
  });
});
