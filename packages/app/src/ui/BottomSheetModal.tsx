import { useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { KeyboardAvoidingView, Modal, Platform, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  TouchableWithoutFeedback,
} from 'react-native-gesture-handler';
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
   * disable the keyboard avoiding view
   * @default false
   * @see KeyboardAvoidingView
   */
  disableKeyboardAvoidingView?: boolean;

  nestedScroll?: boolean;
};

// TODO in the actual implementation, the height of the bottomsheet is actually the given height + insets.bottom
// this is confusing and should be fixed

/**
 * A simple bottom sheet component
 */
const BottomSheetModal = ({
  height = 200,
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
  disableKeyboardAvoidingView,
  nestedScroll = false,
  ...props
}: BottomSheetModalProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const insets = useScreenInsets();
  const intl = useIntl();

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

  useEffect(() => {
    if (visible != null) {
      setIsVisible(visible);
      if (!visible) {
        panTranslationY.value = 0;
      }
    }
  }, [panTranslationY, visible]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
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

    [height, panTranslationY],
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
            style={styles.gestureInteractionIndicator}
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

  return (
    <Modal
      animationType="none"
      visible={isVisible}
      transparent
      onRequestClose={onRequestClose}
      pointerEvents="box-none"
      {...props}
    >
      {/* required for android */}
      <GestureHandlerRootView style={{ height: '100%', width: '100%' }}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior="position"
          contentContainerStyle={styles.absoluteFill}
          enabled={!disableKeyboardAvoidingView}
        >
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
            {nestedScroll && Platform.OS === 'android' ? (
              <>
                <GestureDetector gesture={panGesture}>
                  <View style={styles.gestureViewAndroid} collapsable={false} />
                </GestureDetector>
                {content}
              </>
            ) : (
              <GestureDetector gesture={panGesture}>
                <View style={styles.gestureView}>{content}</View>
              </GestureDetector>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
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
