import { StyleSheet } from 'react-native';
import { colors } from '#theme';
import PressableNative from './PressableNative';
import Text from './Text';
import type { ReactNode } from 'react';

type Props = {
  icon?: ReactNode;
  selected?: boolean;
  label: string;
  onPress?: () => void;
};

const RoundedMenuComponent = (props: Props) => {
  const { icon, selected, label, onPress } = props;

  return (
    <PressableNative
      style={[styles.menu, selected && styles.menuSelected]}
      onPress={onPress}
    >
      {icon}
      <Text variant="button">{label}</Text>
    </PressableNative>
  );
};

export default RoundedMenuComponent;

const styles = StyleSheet.create({
  menu: {
    borderRadius: 33,
    paddingVertical: 7,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderColor: colors.grey50,
    borderWidth: 1,
    borderStyle: 'solid',
  },
  menuSelected: {
    backgroundColor: colors.grey50,
  },
});
