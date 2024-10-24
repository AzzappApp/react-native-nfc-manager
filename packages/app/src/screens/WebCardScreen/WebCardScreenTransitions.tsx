import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import {
  useSharedValue,
  type SharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { EDIT_TRANSITION_DURATION } from './webCardScreenHelpers';

type EditTransitionListener = {
  onStart?: () => void;
  onEnd?: () => void;
};

const EditTransitionContext = createContext<{
  edit: SharedValue<number>;
  selection: SharedValue<number>;
  addEditTransitionListener: (listener: EditTransitionListener) => () => void;
} | null>(null);

export const useEditTransition = () => useContext(EditTransitionContext)?.edit;

export const useSelectionModeTransition = () =>
  useContext(EditTransitionContext)?.selection;

export const useEditTransitionListener = (listener: EditTransitionListener) => {
  const context = useContext(EditTransitionContext);
  const listenerRef = useRef(listener);
  useEffect(() => {
    listenerRef.current = listener;
  }, [listener]);
  useEffect(() => {
    return context?.addEditTransitionListener({
      onStart() {
        listenerRef.current.onStart?.();
      },
      onEnd() {
        listenerRef.current.onEnd?.();
      },
    });
  }, [context]);
};

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
  const editTransitionListeners = useRef<EditTransitionListener[]>([]);

  useEffect(() => {
    if (!init.current) {
      init.current = true;
      editTransition.value = editing ? 1 : 0;
      return;
    }

    const listeners = editTransitionListeners.current;
    listeners.forEach(listener => listener.onStart?.());
    const onEnd = () => {
      listeners.forEach(listener => listener.onEnd?.());
    };
    setTimeout(() => {
      editTransition.value = withTiming(
        editing ? 1 : 0,
        {
          duration: EDIT_TRANSITION_DURATION,
        },
        () => {
          runOnJS(onEnd)();
        },
      );
    }, 0);
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
      addEditTransitionListener: (listener: EditTransitionListener) => {
        editTransitionListeners.current.push(listener);
        return () => {
          const index = editTransitionListeners.current.indexOf(listener);
          if (index !== -1) {
            editTransitionListeners.current.splice(index, 1);
          }
        };
      },
    }),
    [editTransition, selectionTransition],
  );
  return (
    <EditTransitionContext.Provider value={contextValue}>
      {children}
    </EditTransitionContext.Provider>
  );
};
