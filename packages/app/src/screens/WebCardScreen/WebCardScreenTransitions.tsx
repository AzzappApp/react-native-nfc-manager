import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import {
  useSharedValue,
  type SharedValue,
  withTiming,
} from 'react-native-reanimated';
import { EDIT_TRANSITION_DURATION } from './webCardScreenHelpers';

const EditTransitionContext = createContext<{
  edit: SharedValue<number>;
  selection: SharedValue<number>;
} | null>(null);

export const useEditTransition = () => useContext(EditTransitionContext)?.edit;

export const useSelectionModeTransition = () =>
  useContext(EditTransitionContext)?.selection;

export type WebCardScreenEditTransitionProviderProps = {
  editing: boolean;
  selectionMode: boolean;
  children: React.ReactNode;
};

export const WebCardScreenTransitionsProvider = ({
  editing,
  selectionMode,
  children,
}: WebCardScreenEditTransitionProviderProps) => {
  const init = useRef(false);
  const editTransition = useSharedValue(0);

  useEffect(() => {
    if (!init.current) {
      init.current = true;
      editTransition.value = editing ? 1 : 0;
      return;
    }

    editTransition.value = withTiming(editing ? 1 : 0, {
      duration: EDIT_TRANSITION_DURATION,
    });
  }, [editTransition, editing]);

  const selectionTransition = useSharedValue(0);

  useEffect(() => {
    selectionTransition.value = withTiming(selectionMode ? 1 : 0, {
      duration: EDIT_TRANSITION_DURATION,
    });
  }, [selectionTransition, selectionMode]);

  const contextValue = useMemo(
    () => ({
      edit: editTransition,
      selection: selectionTransition,
    }),
    [editTransition, selectionTransition],
  );
  return (
    <EditTransitionContext.Provider value={contextValue}>
      {children}
    </EditTransitionContext.Provider>
  );
};
