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
import { EDIT_TRANSITION_DURATION } from './profileScreenHelpers';

const EditTranstionContext = createContext<{
  edit: SharedValue<number>;
  addEditTransitionStartListener: (
    callback: (editing: boolean) => void,
  ) => () => void;
  addEditTransitionEndListener: (
    callback: (editing: boolean) => void,
  ) => () => void;
  selection: SharedValue<number>;
} | null>(null);

export const useEditTransition = () => useContext(EditTranstionContext)?.edit;

export const useEditTransitionListeners = (callbacks: {
  start?: (editing: boolean) => void;
  end?: (editing: boolean) => void;
}) => {
  const { addEditTransitionStartListener, addEditTransitionEndListener } =
    useContext(EditTranstionContext)!;

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
  useContext(EditTranstionContext)?.selection;

export type ProfileScreenEditTransitionProviderProps = {
  editing: boolean;
  selectionMode: boolean;
  children: React.ReactNode;
};

export const ProfileScreenTransitionsProvider = ({
  editing,
  selectionMode,
  children,
}: ProfileScreenEditTransitionProviderProps) => {
  const editTransition = useSharedValue(0);
  const editTransitionEndlisteners = useRef(
    new Set<(editing: boolean) => void>(),
  );
  const editTransitionStartlisteners = useRef(
    new Set<(editing: boolean) => void>(),
  );

  const onTransitionEnd = useCallback(
    (editing: boolean) => {
      editTransitionEndlisteners.current.forEach(listener => listener(editing));
    },
    [editTransitionEndlisteners],
  );

  const init = useRef(false);

  useEffect(() => {
    if (!init.current) {
      init.current = true;
      editTransition.value = editing ? 1 : 0;
      return;
    }

    editTransitionStartlisteners.current.forEach(listener => listener(editing));
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
      editTransitionEndlisteners.current.add(callback);
      return () => {
        editTransitionEndlisteners.current.delete(callback);
      };
    },
    [],
  );

  const addEditTransitionStartListener = useCallback(
    (callback: (editing: boolean) => void) => {
      editTransitionStartlisteners.current.add(callback);
      return () => {
        editTransitionStartlisteners.current.delete(callback);
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
    <EditTranstionContext.Provider value={contextValue}>
      {children}
    </EditTranstionContext.Provider>
  );
};
