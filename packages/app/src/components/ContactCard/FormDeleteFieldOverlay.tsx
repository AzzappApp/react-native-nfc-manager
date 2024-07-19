import { createContext, useCallback, useContext, useReducer } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { DELETE_BUTTON_WIDTH } from '#helpers/contactCardHelpers';
import type { PropsWithChildren } from 'react';
import type { GestureResponderEvent, LayoutRectangle } from 'react-native';

type Context = {
  deleted: boolean;
  rect: LayoutRectangle | null;
  openDeleteButton: (rect: LayoutRectangle | null) => void;
  closeDeleteButton: () => void;
};

const FormDeleteContext = createContext<Context>({
  deleted: false,
  rect: null,
  openDeleteButton: () => {},
  closeDeleteButton: () => {},
});

export const useFormDeleteContext = () => {
  const context = useContext(FormDeleteContext);

  if (!context) {
    throw new Error(
      'useFormDeleteContext must be used within a FormDeleteContext',
    );
  }

  return context;
};

const reducer = (
  state: Pick<Context, 'deleted' | 'rect'>,
  action:
    | {
        type: 'DELETE_FIELD';
      }
    | {
        type: 'OPEN_DELETION_OPTION';
        payload: LayoutRectangle | null;
      }
    | { type: 'CLOSE_DELETION_OPTION' },
) => {
  switch (action.type) {
    case 'DELETE_FIELD':
      return {
        ...state,
        deleted: true,
        rect: null,
      };
    case 'OPEN_DELETION_OPTION':
      return {
        deleted: false,
        rect: action.payload,
      };
    case 'CLOSE_DELETION_OPTION':
      return {
        deleted: false,
        rect: null,
      };
  }
};

const FormDeleteFieldOverlay = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(reducer, { rect: null, deleted: false });

  const openDeleteButton = useCallback((rect: LayoutRectangle | null) => {
    dispatch({ type: 'OPEN_DELETION_OPTION', payload: rect });
  }, []);

  const closeDeleteButton = useCallback(() => {
    dispatch({
      type: 'CLOSE_DELETION_OPTION',
    });
  }, []);

  const onPress = useCallback(
    (event: GestureResponderEvent) => {
      if (
        state.rect &&
        event.nativeEvent.locationY >= state.rect.y &&
        event.nativeEvent.locationY <= state.rect.y + state.rect.height &&
        event.nativeEvent.locationX >=
          state.rect.x + state.rect.width - DELETE_BUTTON_WIDTH &&
        event.nativeEvent.locationX <= state.rect.x + state.rect.width
      ) {
        dispatch({
          type: 'DELETE_FIELD',
        });
      } else {
        dispatch({
          type: 'CLOSE_DELETION_OPTION',
        });
      }
    },
    [state.rect],
  );

  return (
    <FormDeleteContext.Provider
      value={{ ...state, openDeleteButton, closeDeleteButton }}
    >
      <KeyboardAwareScrollView
        automaticallyAdjustContentInsets
        bottomOffset={Platform.OS === 'ios' ? 30 : 0}
        scrollEnabled={!state.rect}
      >
        {children}
        {state.rect && (
          <Pressable style={StyleSheet.absoluteFill} onPress={onPress} />
        )}
      </KeyboardAwareScrollView>
    </FormDeleteContext.Provider>
  );
};

export default FormDeleteFieldOverlay;
