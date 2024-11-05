import { StyleSheet, useColorScheme } from 'react-native';
import { Svg, Path, Rect } from 'react-native-svg';
import { colors } from '#theme';
import Text from '#ui/Text';

import PressableNative from './PressableNative';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

export type CheckboxStatus = 'checked' | 'mixed' | 'none';
type CheckBoxProps = {
  status: CheckboxStatus;
  disabled?: boolean;
  onValueChange: (status: CheckboxStatus) => void;
  variant?: 'large' | 'small';
  label?: React.ReactNode | string;
  labelStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const CheckBox = ({
  status = 'none',
  disabled = false,
  onValueChange,
  variant = 'large',
  style = {},
  labelStyle,
  label,
  accessibilityLabel,
}: CheckBoxProps) => {
  const ratio = variant === 'large' ? 1 : SMALL_SIZE_RATIO;
  const size = variant === 'large' ? DEFAULT_SIZE : 14;

  const onPress = () => {
    if (!disabled) {
      //mix will be handle by the parent conponent
      onValueChange(status === 'none' ? 'checked' : 'none');
    }
  };
  const scheme = useColorScheme();
  const fillColor =
    status !== 'none'
      ? scheme === 'light'
        ? colors.black
        : colors.grey100
      : 'transparent';
  const strokeColor =
    status !== 'none'
      ? scheme === 'light'
        ? colors.black
        : colors.grey100
      : scheme === 'light'
        ? colors.grey100
        : colors.grey800;
  const checkMark = scheme === 'light' ? colors.white : colors.black;
  return (
    <PressableNative
      accessibilityRole="checkbox"
      style={[styles.container, style]}
      onPress={onPress}
      accessibilityState={{ checked: status !== 'none' }}
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
            rx={3}
            width={size}
            height={size}
            x="1"
            y="1"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1"
          />
          {status === 'checked' && (
            <Path
              scale={ratio}
              translateX={3 * ratio}
              translateY={5 * ratio}
              strokeWidth={1 / ratio}
              stroke={checkMark}
              strokeLinecap="square"
              strokeOpacity={1}
              fillOpacity={1}
              fill={checkMark}
              d={checkMarkPath}
            />
          )}
          {status === 'mixed' && (
            <Path
              scale={ratio}
              translateX={3 * ratio}
              translateY={7.5 * ratio}
              strokeWidth={1 / ratio}
              stroke={checkMark}
              strokeLinecap="square"
              strokeOpacity={1}
              fillOpacity={1}
              fill={checkMark}
              d={mixedMarkpath}
            />
          )}
        </Svg>
        {typeof label === 'string' ? (
          <Text variant="medium" style={labelStyle}>
            {label}
          </Text>
        ) : (
          label
        )}
      </>
    </PressableNative>
  );
};

export default CheckBox;
const checkMarkPath =
  'M4.9249 10.0797L0.116333 5.27112L1.64368 3.74377L5.68858 7.78866L13.4324 0.0448719L14.9597 1.57222L6.45225 10.0797C6.03048 10.5014 5.34667 10.5014 4.9249 10.0797Z';
const mixedMarkpath =
  'M1.38 0.92h11.24s0.5 0 0.5 0.5v1.16s0 0.5 -0.5 0.5h-11.24s-0.5 0 -0.5 -0.5v-1.16s0 -0.5 0.5 -0.5';
const DEFAULT_SIZE = 18;
const SMALL_SIZE_RATIO = 7 / 9;

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
});
