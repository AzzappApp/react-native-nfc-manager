import { memo, useCallback } from 'react';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import PressableNative from './PressableNative';
import Text from './Text';
import type { TextVariant } from './Text';

type Props = {
  selected?: boolean;
  id: string | null;
  label: string;
  onSelect?: (id: string | null) => void;
  textVariant?: TextVariant;
};

const RoundedMenuComponent = ({
  selected,
  label,
  onSelect,
  id,
  textVariant = 'button',
}: Props) => {
  const styles = useStyleSheet(styleSheet);

  const onPress = useCallback(() => {
    if (onSelect) {
      onSelect(id);
    }
  }, [id, onSelect]);

  return (
    <PressableNative
      style={[styles.menu, selected && styles.menuSelected]}
      onPress={onPress}
    >
      <Text variant={textVariant}>{label}</Text>
    </PressableNative>
  );
};
//using memo because part of a list
export default memo(RoundedMenuComponent);

const styleSheet = createStyleSheet(appearance => ({
  menu: {
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: appearance === 'light' ? colors.grey50 : colors.grey900,
    borderWidth: 1,
    borderStyle: 'solid',
  },
  menuSelected: {
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey900,
  },
}));
