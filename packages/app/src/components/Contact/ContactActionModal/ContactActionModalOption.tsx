import { View, StyleSheet } from 'react-native';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { Icons } from '#ui/Icon';
import type { ReactNode } from 'react';

export type ContactActionModalOptionProps = {
  icon: Icons;
  text: ReactNode;
  onPress: () => void;
  disabled?: boolean;
};

const ContactActionModalOption = ({
  icon,
  text,
  onPress,
  disabled,
}: ContactActionModalOptionProps) => {
  const inner = (
    <PressableNative
      style={styles.bottomSheetOptionButton}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.bottomSheetOptionContainer}>
        <View style={styles.bottomSheetOptionIconLabel}>
          <Icon icon={icon} />
          <Text>{text}</Text>
        </View>
        <Icon icon="arrow_right" />
      </View>
    </PressableNative>
  );
  return inner;
};

const ROW_HEIGHT = 42;

const styles = StyleSheet.create({
  bottomSheetOptionButton: {
    paddingVertical: 5,
    paddingHorizontal: 20,
    height: ROW_HEIGHT,
    justifyContent: 'center',
  },
  bottomSheetOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  bottomSheetOptionIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
});
export default ContactActionModalOption;
