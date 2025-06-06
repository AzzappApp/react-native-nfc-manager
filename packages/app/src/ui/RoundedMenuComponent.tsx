import { memo, useCallback } from 'react';
import { View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import PressableNative from './PressableNative';
import Text from './Text';
import type { TextVariant } from './Text';
import type { TextStyle, ViewStyle } from 'react-native';

type Props = {
  selected?: boolean;
  id: string | null;
  label: string;
  onSelect?: (id: string | null) => void;
  textVariant?: TextVariant;
  style?: ViewStyle | ViewStyle[];
  selectedStyle?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  selectedTextStyle?: TextStyle | TextStyle[];
  rightElement?: JSX.Element;
  containerRef?: React.RefObject<View | null>;
};

const RoundedMenuComponent = ({
  selected,
  label,
  onSelect,
  id,
  textVariant = 'button',
  style,
  selectedStyle,
  textStyle,
  rightElement,
  selectedTextStyle,
  containerRef,
}: Props) => {
  const styles = useStyleSheet(styleSheet);

  const onPress = useCallback(() => {
    if (onSelect) {
      onSelect(id);
    }
  }, [id, onSelect]);

  return (
    <View
      ref={containerRef}
      style={[
        styles.menu,
        selected && styles.menuSelected,
        style,
        selected && selectedStyle,
      ]}
    >
      <PressableNative style={styles.menuPressable} onPress={onPress}>
        <Text
          variant={textVariant}
          style={[textStyle, selected && selectedTextStyle]}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {label}
        </Text>
        {rightElement}
      </PressableNative>
    </View>
  );
};
//using memo because part of a list
export default memo(RoundedMenuComponent);

const styleSheet = createStyleSheet(appearance => ({
  menu: {
    overflow: 'hidden',
    borderRadius: 16,
    borderColor: appearance === 'light' ? colors.grey100 : colors.grey900,
    borderWidth: 1,
    height: 32,
  },
  menuPressable: {
    borderStyle: 'solid',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  menuSelected: {
    backgroundColor: appearance === 'light' ? colors.grey100 : colors.grey900,
  },
}));
