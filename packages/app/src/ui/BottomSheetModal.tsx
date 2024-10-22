import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import {
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  StatusBar,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  TouchableWithoutFeedback,
} from 'react-native-gesture-handler';
import {
  KeyboardAvoidingView,
  KeyboardController,
  KeyboardEvents,
} from 'react-native-keyboard-controller';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, shadow } from '#theme';
import Toast from '#components/Toast';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useAnimatedState from '#hooks/useAnimatedState';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from './Button';
import Header from './Header';
import type { HeaderProps } from './Header';
import type { ModalProps, StyleProp, ViewStyle } from 'react-native';
import type { GestureType, PanGesture } from 'react-native-gesture-handler';

export type BottomSheetModalProps = Omit<
  ModalProps,
  'animated' | 'animationType' | 'onRequestClose' | 'transparent'
> & {
  /**
   * The height of the bottomsheet @default 200
   */
  height?: number;
  /**
   * @see HeaderProps#title
   */
  headerTitle?: HeaderProps['middleElement'];
  /**
   * @see HeaderProps#rightButton
   */
  headerLeftButton?: HeaderProps['leftElement'];
  /**
   * @see HeaderProps#rightButton
   */
  headerRightButton?: HeaderProps['rightElement'];
  /**
   * The variant of the bottomsheet @default 'default'
   */
  variant?: 'default' | 'modal';
  /**
   * The style of the bottomsheet content container, since the bottomsheet has a default padding
   * and margin, you can use this to override the default style
   */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /**
   * The style of the header
   */
  headerStyle?: StyleProp<ViewStyle>;
  /**
   *
   * disableGestureInteraction
   */
  disableGestureInteraction?: boolean;
  /**
   * add a small horizontal line marker to indicate the gesture is available
   *
   * @type {boolean} @default true
   */
  showGestureIndicator?: boolean;
  /**
   * @see ModalProps#onRequestClose
   */
  onRequestClose: () => void;
  /**
   * If `true`, the bottom sheet will support nested scrolling.
   * This is useful when the bottom sheet contains a scrollable element, such as a list or a long form.
   * If `false`, the bottom sheet will not respond to scroll events on its children.
   * @default false
   */
  nestedScroll?: boolean;
  /**
   * If `true`, the bottom sheet will appear on top of the keyboard.
   * @default false
   */
  avoidKeyboard?: boolean;
  /**
   * If `true`, the bottom sheet will not be visible by default
   * @default false
   */
  lazy?: boolean;

  nativeGestureItems?: GestureType[];
};

// TODO in the actual implementation, the height of the bottomsheet is actually the given height + insets.bottom
// this is confusing and should be fixed

const BottomSheetModalContext = createContext<{
  panGesture: PanGesture;
} | null>(null);

export const useBottomSheetModalContext = (
  allowedOutsideOfContext: boolean = false,
) => {
  const context = useContext(BottomSheetModalContext);
  if (context === null) {
    if (allowedOutsideOfContext) {
      return { panGesture: undefined };
    }
    throw new Error(
      'useBottomSheetModalContext must be used within a BottomSheetModalContext.Provider',
    );
  }
  return context;
};

/**
 * A simple bottom sheet component
 */
const BottomSheetModal = ({
  height: baseHeight = 200,
  visible,
  headerTitle,
  headerLeftButton,
  headerRightButton,
  children,
  variant,
  disableGestureInteraction,
  contentContainerStyle,
  headerStyle,
  showGestureIndicator = true,
  onRequestClose,
  nestedScroll = false,
  avoidKeyboard,
  lazy = false,
  nativeGestureItems = [],
  ...props
}: BottomSheetModalProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const insets = useScreenInsets();
  const intl = useIntl();

  const height = useMemo(() => {
    const navbarHeight =
      Dimensions.get('screen').height -
      Dimensions.get('window').height -
      (StatusBar.currentHeight || 0);

    return baseHeight + navbarHeight;
  }, [baseHeight]);

  if (variant === 'default' && headerRightButton === undefined) {
    headerRightButton = (
      <Button
        label={intl.formatMessage({
          defaultMessage: 'Close',
          description: 'Bottom sheet close button',
        })}
        onPress={onRequestClose}
      />
    );
  }

  const hasHeader =
    headerTitle != null ||
    headerLeftButton != null ||
    headerRightButton != null;

  const disableGestureInteractionRef = useRef(disableGestureInteraction);
  useEffect(() => {
    disableGestureInteractionRef.current = disableGestureInteraction;
  }, [disableGestureInteraction]);

  const styles = useStyleSheet(styleSheet);
  const translateY = useAnimatedState(isVisible);
  const panTranslationY = useSharedValue(0);

  const openAfterKeyBoardDismiss = useRef(false);
  const handleKeyBoardEnd = () => {
    if (openAfterKeyBoardDismiss.current) {
      setIsVisible(true);
      openAfterKeyBoardDismiss.current = false;
    }
  };

  useEffect(() => {
    const listener = KeyboardEvents.addListener(
      'keyboardDidHide',
      handleKeyBoardEnd,
    );
    return () => {
      listener.remove();
    };
  }, []);

  useEffect(() => {
    if (visible && Keyboard.isVisible()) {
      openAfterKeyBoardDismiss.current = true;
      KeyboardController.dismiss();
    } else {
      setIsVisible(visible ?? false);
    }
    return () => {
      openAfterKeyBoardDismiss.current = false;
    };
  }, [visible]);

  useEffect(() => {
    if (!isVisible) {
      panTranslationY.value = 0;
    }
  }, [panTranslationY, isVisible]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .simultaneousWithExternalGesture(...nativeGestureItems)
        .enabled(!disableGestureInteractionRef.current)
        .onChange(e => {
          panTranslationY.value = Math.max(0, e.translationY) / height;
        })
        .onEnd(() => {
          if (panTranslationY.value > 0.5) {
            panTranslationY.value = withSpring(1);
          } else {
            panTranslationY.value = withSpring(0);
          }
        }),
    [height, panTranslationY, nativeGestureItems],
  );

  useAnimatedReaction(
    () => panTranslationY.value,
    positionYValue => {
      if (positionYValue !== null && positionYValue >= 1) {
        runOnJS(onRequestClose)();
      }
    },
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            translateY.value - panTranslationY.value,
            [0, 1],
            [0, -(height + insets.bottom)],
          ),
        },
      ],
    };
  });

  const backgroundOpacity = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        translateY.value - panTranslationY.value,
        [0, 1],
        [0, 0.8],
      ),
    };
  });

  const content = useMemo(() => {
    return (
      <>
        {!disableGestureInteraction && showGestureIndicator && (
          <View
            style={[styles.gestureInteractionIndicator]}
            pointerEvents="box-none"
          />
        )}
        {hasHeader && (
          <Header
            style={[styles.accessoryView, headerStyle]}
            middleElement={headerTitle}
            leftElement={headerLeftButton}
            rightElement={headerRightButton}
          />
        )}
        {children}
      </>
    );
  }, [
    children,
    disableGestureInteraction,
    hasHeader,
    headerLeftButton,
    headerRightButton,
    headerStyle,
    headerTitle,
    showGestureIndicator,
    styles.accessoryView,
    styles.gestureInteractionIndicator,
  ]);

  // #endregion

  const bottomSheetContextValue = useMemo(
    () => ({
      panGesture,
    }),
    [panGesture],
  );

  return (
    <Modal
      animationType="none"
      visible={isVisible}
      transparent
      onRequestClose={onRequestClose}
      pointerEvents="box-none"
      {...props}
    >
      {lazy && !isVisible ? null : (
        <KeyboardAvoidingView
          behavior={avoidKeyboard ? 'height' : undefined}
          style={{ height: '100%', width: '100%' }}
        >
          {/* required for android */}
          <GestureHandlerRootView style={{ height: '100%', width: '100%' }}>
            <TouchableWithoutFeedback
              style={styles.absoluteFill}
              onPress={onRequestClose}
            >
              <View style={styles.absoluteFill}>
                {variant === 'modal' && (
                  <Animated.View
                    style={[
                      styles.absoluteFill,
                      {
                        backgroundColor: colors.black,
                      },
                      backgroundOpacity,
                    ]}
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.bottomSheetContainer,
                {
                  height: height + insets.bottom,
                  paddingBottom: insets.bottom,
                },
                contentContainerStyle,
                animatedStyle,
              ]}
            >
              <BottomSheetModalContext.Provider value={bottomSheetContextValue}>
                {nestedScroll && Platform.OS === 'android' ? (
                  <>
                    <GestureDetector gesture={panGesture}>
                      <View
                        style={styles.gestureViewAndroid}
                        collapsable={false}
                      />
                    </GestureDetector>
                    {content}
                  </>
                ) : (
                  <GestureDetector gesture={panGesture}>
                    <View style={styles.gestureView}>{content}</View>
                  </GestureDetector>
                )}
              </BottomSheetModalContext.Provider>
            </Animated.View>
          </GestureHandlerRootView>
        </KeyboardAvoidingView>
      )}
      <Toast />
    </Modal>
  );
};

export default BottomSheetModal;

const styleSheet = createStyleSheet(appearance => ({
  gestureInteractionIndicator: {
    backgroundColor: appearance === 'light' ? colors.grey100 : colors.white,
    height: 4,
    width: 40,
    alignSelf: 'center',
    borderRadius: 2,
    marginBottom: 4,
  },
  gestureView: { flex: 1, backgroundColor: 'transparent' },
  gestureViewAndroid: {
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
  modalContainer: {
    flex: 1,
  },
  absoluteFill: {
    width: '100%',
    height: '100%',
  },
  bottomSheetContainer: [
    {
      position: 'absolute',
      top: '100%',
      left: 0,
      width: '100%',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingTop: 16,
      paddingHorizontal: 20,
      backgroundColor: appearance === 'light' ? colors.white : colors.black,
    },
    shadow(appearance, 'top'),
  ],
  accessoryView: {
    marginBottom: 10,
    paddingHorizontal: 0,
  },
}));
