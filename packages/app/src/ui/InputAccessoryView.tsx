import { TouchableWithoutFeedback, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenInsets from '#hooks/useScreenInsets';
import type { StyleProp, ViewStyle } from 'react-native';

type InputAccessoryViewProps = {
  visible: boolean;
  children: React.ReactNode;
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
};

const InputAccessoryView = ({
  visible,
  children,
  onClose,
  style,
}: InputAccessoryViewProps) => {
  const styles = useStyleSheet(styleSheet);

  const insets = useScreenInsets();

  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.titleModal, style, { paddingBottom: insets.bottom }]}>
      <TouchableWithoutFeedback onPress={onClose} style={styles.overlay}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <KeyboardStickyView
        style={styles.modalContainer}
        offset={{ opened: insets.bottom }}
      >
        {children}
      </KeyboardStickyView>
    </View>
  );
};

export default InputAccessoryView;

const styleSheet = createStyleSheet(appearance => ({
  titleModal: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  overlay: {
    flex: 1,
  },
  modalContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    ...shadow({ appearance, direction: 'top' }),
  },
}));
