import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  useSharedValue,
  type SharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { EDIT_TRANSITION_DURATION } from './webCardScreenHelpers';

const EditTransitionContext = createContext<{
  edit: SharedValue<number>;
  addEditTransitionStartListener: (
    callback: (editing: boolean) => void,
  ) => () => void;
  addEditTransitionEndListener: (
    callback: (editing: boolean) => void,
  ) => () => void;
  selection: SharedValue<number>;
} | null>(null);

export const useEditTransition = () => useContext(EditTransitionContext)?.edit;

export const useEditTransitionListeners = (callbacks: {
  start?: (editing: boolean) => void;
  end?: (editing: boolean) => void;
}) => {
  const { addEditTransitionStartListener, addEditTransitionEndListener } =
    useContext(EditTransitionContext)!;

  const startRef = useRef(callbacks.start);
  const endRef = useRef(callbacks.end);

  useEffect(() => {
    startRef.current = callbacks.start;
  }, [callbacks.start]);

  useEffect(() => {
    endRef.current = callbacks.end;
  }, [callbacks.end]);

  useEffect(
    () =>
      addEditTransitionStartListener(editing => startRef.current?.(editing)),
    [addEditTransitionStartListener],
  );

  useEffect(
    () => addEditTransitionEndListener(editing => endRef.current?.(editing)),
    [addEditTransitionEndListener],
  );
};

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
  const editTransition = useSharedValue(0);
  const editTransitionEndListeners = useRef(
    new Set<(editing: boolean) => void>(),
  );
  const editTransitionStartListeners = useRef(
    new Set<(editing: boolean) => void>(),
  );

  const onTransitionEnd = useCallback(
    (editing: boolean) => {
      editTransitionEndListeners.current.forEach(listener => listener(editing));
    },
    [editTransitionEndListeners],
  );

  const init = useRef(false);

  useEffect(() => {
    if (!init.current) {
      init.current = true;
      editTransition.value = editing ? 1 : 0;
      return;
    }

    editTransitionStartListeners.current.forEach(listener => listener(editing));
    editTransition.value = withTiming(
      editing ? 1 : 0,
      {
        duration: EDIT_TRANSITION_DURATION,
      },
      () => {
        runOnJS(onTransitionEnd)(editing);
      },
    );
  }, [editTransition, editing, onTransitionEnd]);

  const addEditTransitionEndListener = useCallback(
    (callback: (editing: boolean) => void) => {
      editTransitionEndListeners.current.add(callback);
      return () => {
        editTransitionEndListeners.current.delete(callback);
      };
    },
    [],
  );

  const addEditTransitionStartListener = useCallback(
    (callback: (editing: boolean) => void) => {
      editTransitionStartListeners.current.add(callback);
      return () => {
        editTransitionStartListeners.current.delete(callback);
      };
    },
    [],
  );

  const selectionTransition = useSharedValue(0);
  useEffect(() => {
    selectionTransition.value = withTiming(selectionMode ? 1 : 0, {
      duration: EDIT_TRANSITION_DURATION,
    });
  }, [selectionTransition, selectionMode]);

  const contextValue = useMemo(
    () => ({
      edit: editTransition,
      addEditTransitionEndListener,
      addEditTransitionStartListener,
      selection: selectionTransition,
    }),
    [
      addEditTransitionEndListener,
      addEditTransitionStartListener,
      editTransition,
      selectionTransition,
    ],
  );
  return (
    <EditTransitionContext.Provider value={contextValue}>
      {children}
    </EditTransitionContext.Provider>
  );
};
