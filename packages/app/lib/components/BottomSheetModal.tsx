import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, textStyles } from '../../theme';
import useSafeAreaInsets from '../hooks/useSafeAreaInsets.web';
import type { ModalProps } from 'react-native';

type BottomSheetModal = Omit<
  ModalProps,
  'animated' | 'animationType' | 'onRequestClose' | 'transparent'
> & {
  title: string;
  height?: number;
  onRequestClose(): void;
};

const BottomSheetModal = ({
  children,
  height = 200,
  visible,
  onRequestClose,
  title,
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

  return (
    <Modal animationType="none" visible={isVisible} {...props} transparent>
      <View style={styles.modalContainer}>
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
            <View style={styles.spacer} />
            <Text style={[textStyles.title, styles.accessoryViewLabel]}>
              {title}
            </Text>
            <Pressable
              style={styles.okButton}
              hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
              onPress={onRequestClose}
            >
              <Text style={[textStyles.button, styles.okButtonLabel]}>OK</Text>
            </Pressable>
          </View>
          {children}
        </Animated.View>
      </View>
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
