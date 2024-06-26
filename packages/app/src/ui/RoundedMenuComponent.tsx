import { memo, useCallback } from 'react';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import PressableNative from './PressableNative';
import Text from './Text';

type Props = {
  selected?: boolean;
  id: string | null;
  label: string;
  onSelect?: (id: string | null) => void;
};

const RoundedMenuComponent = (props: Props) => {
  const { selected, label, onSelect, id } = props;
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
      <Text variant="button">{label}</Text>
    </PressableNative>
  );
};
//using memo because part of a list
export default memo(RoundedMenuComponent);

const styleSheet = createStyleSheet(appearance => ({
  menu: {
    height: 32,
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderColor: appearance === 'light' ? colors.grey50 : colors.grey900,
    borderWidth: 1,
    borderStyle: 'solid',
  },
  menuSelected: {
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey900,
  },
}));
