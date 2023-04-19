import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useViewportSize, { insetBottom } from '#hooks/useViewportSize';
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
};

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
  showGestureIndicator = true,
  onRequestClose,
  ...props
}: BottomSheetModalProps) => {
  const animation = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const appearanceStyle = useStyleSheet(computedStyle);
  const [isVisible, setIsVisible] = useState(false);
  const currentAnimationRef = useRef<Animated.CompositeAnimation | null>();
  useEffect(() => {
    let canceled = false;
    if (visible) {
      setIsVisible(true);
    }
    currentAnimationRef.current?.stop();
    currentAnimationRef.current = Animated.spring(animation, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      bounciness: 0,
    });
    currentAnimationRef.current.start(
      !visible
        ? () => {
            if (!canceled) {
              setIsVisible(false);
            }
          }
        : undefined,
    );
    return () => {
      canceled = false;
    };
  }, [animation, visible]);

  const vp = useViewportSize();
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

  // there is issue when the height is not known at the first render(if initial height is 0), it will crash on pandown
  const createPanResponder = useCallback(
    (height: number) => {
      return PanResponder.create({
        onStartShouldSetPanResponder: () =>
          disableGestureInteractionRef.current !== true,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            if (height > 0) {
              // division by zero (even if should not happened, it happened during dev and will crash the app)
              animation.setValue(1 - gestureState.dy / height);
            }
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 0) {
            if (gestureState.dy > height / 2) {
              onRequestClose();
            } else {
              Animated.spring(animation, {
                toValue: 1,
                useNativeDriver: true,
                bounciness: 0,
              }).start();
            }
          }
        },
      });
    },
    [animation, onRequestClose],
  );

  const pan = useRef(createPanResponder(height));

  useEffect(() => {
    pan.current = createPanResponder(height);
  }, [createPanResponder, height, pan]);

  return (
    <Modal
      animationType="none"
      visible={isVisible}
      onRequestClose={onRequestClose}
      {...props}
      transparent
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
                  opacity: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.8],
                  }),
                },
              ]}
            />
          )}
        </View>
      </TouchableWithoutFeedback>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior="position"
        contentContainerStyle={styles.absoluteFill}
      >
        <Animated.View
          {...pan?.current.panHandlers}
          style={[
            styles.bottomSheetContainer,
            appearanceStyle.bottomSheetContainer,
            contentContainerStyle,
            {
              height: vp`${height} + ${insetBottom}`,
              paddingBottom: vp`${insetBottom}`,
            },
            {
              transform: [
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -(height + vp`${insetBottom}`)],
                  }),
                },
              ],
            },
          ]}
        >
          {!disableGestureInteraction && showGestureIndicator && (
            <View style={appearanceStyle.gestureInteractionIndicator} />
          )}
          {hasHeader && (
            <Header
              style={styles.accessoryView}
              middleElement={headerTitle}
              leftElement={headerLeftButton}
              rightElement={headerRightButton}
            />
          )}
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default BottomSheetModal;

const computedStyle = createStyleSheet(appearance => ({
  gestureInteractionIndicator: {
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
    height: 4,
    width: 20,
    alignSelf: 'center',
    borderRadius: 2,
    marginBottom: 4,
  },
  bottomSheetContainer: {
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    shadowColor: appearance === 'light' ? colors.grey900 : colors.grey800,
  },
}));

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  absoluteFill: {
    width: '100%',
    height: '100%',
  },
  bottomSheetContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 20,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 29,

    elevation: 7,
  },
  accessoryView: {
    marginBottom: 10,
    paddingHorizontal: 0,
  },
});
