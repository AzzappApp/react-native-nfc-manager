import { useEffect, useState } from 'react';
import { addAuthStateListener, getAuthState } from '#helpers/authStore';

/**
 * Hook to get the current auth state
 */
const useAuthState = () => {
  const [state, setState] = useState(getAuthState());
  useEffect(() => addAuthStateListener(setState), []);
  return state;
};

export default useAuthState;
