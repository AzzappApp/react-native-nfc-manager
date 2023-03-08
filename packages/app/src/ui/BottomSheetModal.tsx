import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, textStyles } from '#theme';
import Button from './Button';
import type { ModalProps } from 'react-native';

type BottomSheetModal = Omit<
  ModalProps,
  'animated' | 'animationType' | 'onRequestClose' | 'transparent'
> & {
  title: string;
  height?: number;
  onValidate(): void;
  onCancel?(): void;
  cancelable?: boolean;
  cancelLabel?: string;
  validationButtonLabel: string;
  validationButtonDisabled?: boolean;
};

const BottomSheetModal = ({
  children,
  height = 200,
  visible,
  onValidate,
  onCancel,
  title,
  cancelable = true,
  validationButtonLabel,
  validationButtonDisabled = false,
  ...props
}: BottomSheetModal) => {
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
    <Modal animationType="none" visible={isVisible} {...props} transparent>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior="position"
        contentContainerStyle={{
          backgroundColor: '#transparent',
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
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
          <View style={styles.accessoryView}>
            {cancelable && onCancel ? (
              <Button
                label={intl.formatMessage({
                  defaultMessage: 'Cancel',
                  description: 'BottomSheetModal - default Cancel button label',
                })}
                accessibilityLabel={intl.formatMessage({
                  defaultMessage: 'Tap to cancel and close',
                  description:
                    'BottomSheetModal accessibility label - Close button',
                })}
                variant="secondary"
                onPress={onCancel}
              />
            ) : (
              <View style={styles.spacer} />
            )}
            <Text style={[textStyles.title, styles.accessoryViewLabel]}>
              {title}
            </Text>
            <Button
              label={validationButtonLabel}
              onPress={onValidate}
              disabled={validationButtonDisabled}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Tap to validate and close',
                description:
                  'BottomSheetModal accessibility label - Validate button',
              })}
            />
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
  },
  spacer: {
    width: 40,
  },
  accessoryViewLabel: {
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  okButton: {
    backgroundColor: colors.orange,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okButtonLabel: {
    color: '#FFF',
  },
});
