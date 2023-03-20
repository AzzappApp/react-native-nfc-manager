import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  StyleSheet,
} from 'react-native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '#theme';
import Header from '#components/Header';
import Button from './Button';
import type { HeaderProps } from '#components/Header';
import type { ModalProps } from 'react-native';

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

  const { bottom } = useSafeAreaInsets();
  const intl = useIntl();
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
      />
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior="position"
        contentContainerStyle={styles.absoluteFill}
      >
        <Animated.View
          style={[
            styles.bottomSheetContainer,
            { height: height + bottom, paddingBottom: bottom },
            {
              transform: [
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -(height + bottom)],
                  }),
                },
              ],
            },
          ]}
        >
          <Header
            style={styles.accessoryView}
            title={headerTitle}
            leftButton={headerLeftButton}
            rightButton={
              headerRightButton !== undefined ? (
                headerRightButton
              ) : (
                <Button
                  label={intl.formatMessage({
                    defaultMessage: 'Close',
                    description: 'Bottom sheet close button',
                  })}
                  onPress={onRequestClose}
                />
              )
            }
          />
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default BottomSheetModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  absoluteFill: {
    backgroundColor: 'transparent',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
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
