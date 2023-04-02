import { useEffect, useRef, useState } from 'react';
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
import Header from '#components/Header';
import useViewportSize, { insetBottom } from '#hooks/useViewportSize';
import Button from './Button';
import type { HeaderProps } from '#components/Header';
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
  headerTitle?: HeaderProps['title'];
  /**
   * @see HeaderProps#rightButton
   */
  headerLeftButton?: HeaderProps['leftButton'];
  /**
   * @see HeaderProps#rightButton
   */
  headerRightButton?: HeaderProps['rightButton'];
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
   * disableGestureInteraction
   */
  disableGestureInteraction?: boolean;
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
  onRequestClose,
  ...props
}: BottomSheetModalProps) => {
  const animation = useRef(new Animated.Value(visible ? 1 : 0)).current;

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
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () =>
        disableGestureInteractionRef.current !== true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          animation.setValue(1 - gestureState.dy / height);
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
    }),
  ).current;

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
                  backgroundColor: colors.dark,
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
          {...pan.panHandlers}
          style={[
            styles.bottomSheetContainer,
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
          {!disableGestureInteraction && (
            <View style={styles.gestureInteractionIndicator} />
          )}
          {hasHeader && (
            <Header
              style={styles.accessoryView}
              title={headerTitle}
              leftButton={headerLeftButton}
              rightButton={headerRightButton}
            />
          )}
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default BottomSheetModal;

const styles = StyleSheet.create({
  gestureInteractionIndicator: {
    backgroundColor: colors.black,
    height: 4,
    width: 20,
    alignSelf: 'center',
    borderRadius: 2,
    marginBottom: 4,
  },
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
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 20,
    shadowColor: colors.grey900,
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
