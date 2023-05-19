import { renderHook, act } from '@testing-library/react-hooks';
import useToggle from '../useToggle';

describe('useToggle', () => {
  it('should initialize with the correct initial state', () => {
    const { result } = renderHook(() => useToggle(true));

    const [state] = result.current;

    expect(state).toBe(true);
  });

  it('should toggle the state', () => {
    const { result } = renderHook(() => useToggle(false));

    const [, toggle] = result.current;

    act(() => {
      toggle();
    });

    const [state] = result.current;

    expect(state).toBe(true);
  });
});
