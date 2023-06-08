import { useCallback, useState } from 'react';
/**
 * A hook that returns a state and a function to toggle it.
 *
 * @param {boolean} [initialState=false]
 * @return {*}
 */
const useToggle = (initialState = false): [boolean, () => void] => {
  const [state, setState] = useState(initialState);

  const toggle = useCallback(() => setState(state => !state), []);

  return [state, toggle];
};

export default useToggle;
