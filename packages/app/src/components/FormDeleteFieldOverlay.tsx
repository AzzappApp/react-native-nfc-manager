import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  forwardRef,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { DELETE_BUTTON_WIDTH } from '#helpers/contactHelpers';
import type { LegacyRef, PropsWithChildren } from 'react';
import type {
  GestureResponderEvent,
  LayoutRectangle,
  ScrollView,
} from 'react-native';
import type { KeyboardAwareScrollViewProps } from 'react-native-keyboard-controller';

type Context = {
  deleted: boolean;
  rect: LayoutRectangle | null;
  openDeleteButton: (rect: LayoutRectangle | null) => void;
  closeDeleteButton: () => void;
};

const FormDeleteContext = createContext<Context | null>(null);

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

const FormDeleteFieldOverlay = (
  { children, ...props }: PropsWithChildren<KeyboardAwareScrollViewProps>,
  ref: LegacyRef<ScrollView>,
) => {
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
        ref={ref}
        bottomOffset={30}
        scrollEnabled={!state.rect}
        {...props}
      >
        <View
          style={{
            pointerEvents: state.rect ? 'none' : 'auto',
          }}
        >
          {children}
        </View>
        {state.rect && (
          <Pressable style={StyleSheet.absoluteFill} onPress={onPress} />
        )}
      </KeyboardAwareScrollView>
    </FormDeleteContext.Provider>
  );
};

export default forwardRef(FormDeleteFieldOverlay);
