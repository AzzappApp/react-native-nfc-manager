import { useCallback, useState } from 'react';
/**
 * A hook that returns a state and a function to toggle it.
 *
 * @param {boolean} [initialState=false]
 * @return {*}
 */
const useBoolean = (
  initialState = false,
): [boolean, () => void, () => void, () => void] => {
  const [state, setState] = useState(initialState);
  const setTrue = useCallback(() => setState(true), []);
  const setFalse = useCallback(() => setState(false), []);
  const toggle = useCallback(() => setState(state => !state), []);
  return [state, setTrue, setFalse, toggle];
};

export default useBoolean;
