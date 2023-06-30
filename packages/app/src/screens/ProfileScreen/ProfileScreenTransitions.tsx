import { createContext, useContext, useEffect } from 'react';
import {
  useSharedValue,
  type SharedValue,
  withTiming,
} from 'react-native-reanimated';
import { EDIT_TRANSITION_DURATION } from './profileScreenHelpers';

const EditTranstionContext = createContext<{
  edit: SharedValue<number>;
  selection: SharedValue<number>;
}>({
  edit: {
    value: 0,
  },
  selection: {
    value: 0,
  },
});

export const useEditTransition = () => useContext(EditTranstionContext).edit;

export const useSelectionModeTransition = () =>
  useContext(EditTranstionContext).selection;

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
  useEffect(() => {
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
  return (
    <EditTranstionContext.Provider
      value={{ edit: editTransition, selection: selectionTransition }}
    >
      {children}
    </EditTranstionContext.Provider>
  );
};
