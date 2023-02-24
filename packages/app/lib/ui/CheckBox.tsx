import { StyleSheet, Text } from 'react-native';

import { Svg, Path, Rect } from 'react-native-svg';
import { colors, fontFamilies } from '../theme';

import PressableNative from './PressableNative';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
//TODO: can be improve by selecting position of the label
//TODO: Dark Mode
type CheckBoxProps = {
  checked: boolean;
  disabled?: boolean;
  onValueChange: (checked: boolean) => void;
  borderRadius?: number;
  borderColor?: string;
  checkBorderColor?: string;
  tintColor?: string;
  checkTintColor?: string;
  checkMarkColor?: string;
  size?: number;
  label?: React.ReactNode | string;
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const checkMarkPath =
  'M4.9249 10.0797L0.116333 5.27112L1.64368 3.74377L5.68858 7.78866L13.4324 0.0448719L14.9597 1.57222L6.45225 10.0797C6.03048 10.5014 5.34667 10.5014 4.9249 10.0797Z';
const DEFAULT_SIZE = 18;
const CheckBox = ({
  size = DEFAULT_SIZE,
  checked = false,
  disabled = false,
  onValueChange,
  containerStyle = {},
  borderColor = colors.grey200,
  checkBorderColor = colors.black,
  tintColor = 'white',
  checkTintColor = colors.black,
  checkMarkColor = 'white',
  borderRadius = 3,
  labelStyle,
  label,
  accessibilityLabel,
}: CheckBoxProps) => {
  const ratio = size / DEFAULT_SIZE;
  const onPress = () => {
    if (!disabled) {
      onValueChange(!checked);
    }
  };
  return (
    <PressableNative
      accessibilityRole="checkbox"
      testID="azzapp__CheckBox__view-wrapper"
      style={[styles.container, containerStyle]}
      onPress={onPress}
      accessibilityState={{ checked }}
      activeOpacity={1}
      accessibilityLabel={accessibilityLabel}
    >
      <>
        <Svg
          width={size + 2}
          height={size + 2}
          viewBox={`0 0 ${size + 2} ${size + 2}`}
        >
          <Rect
            rx={borderRadius}
            width={size}
            height={size}
            x="1"
            y="1"
            fill={checked ? checkTintColor : tintColor}
            stroke={checked ? checkBorderColor : borderColor}
            strokeWidth="1"
          />
          <Path
            scale={ratio}
            translateX={3 * ratio}
            translateY={5 * ratio}
            strokeWidth={1 / ratio}
            stroke={checkMarkColor}
            strokeLinecap="square"
            strokeOpacity={checked || false ? 1 : 0}
            fillOpacity={checked || false ? 1 : 0}
            fill={checkMarkColor}
            d={checkMarkPath}
          />
        </Svg>
        {typeof label === 'string' ? (
          <Text style={[styles.textStyle, labelStyle]}>{label}</Text>
        ) : (
          label
        )}
      </>
    </PressableNative>
  );
};

export default CheckBox;

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  textStyle: { ...fontFamilies.fontMedium, fontSize: 14, color: colors.black },
});
