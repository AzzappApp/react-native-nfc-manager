import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
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
}: Props) => {
  const styles = useStyleSheet(styleSheet);

  const onPress = useCallback(() => {
    if (onSelect) {
      onSelect(id);
    }
  }, [id, onSelect]);

  const flattenStyle = StyleSheet.flatten(style);
  const flattenSelectedStyle = selected
    ? StyleSheet.flatten(selectedStyle)
    : {};
  const flattenSelectedTextStyle = selected
    ? StyleSheet.flatten(selectedTextStyle)
    : {};

  return (
    <View
      style={[
        styles.menu,
        selected && styles.menuSelected,
        flattenStyle,
        flattenSelectedStyle,
      ]}
    >
      <PressableNative style={styles.menuPressable} onPress={onPress}>
        <Text
          variant={textVariant}
          style={[textStyle, flattenSelectedTextStyle]}
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
  },
  menuPressable: {
    borderStyle: 'solid',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 16,
    height: 32,
  },
  menuSelected: {
    backgroundColor: appearance === 'light' ? colors.grey100 : colors.grey900,
  },
}));
