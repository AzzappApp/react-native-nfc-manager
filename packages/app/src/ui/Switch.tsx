import { Switch as RNSwitch } from 'react-native';
import { colors } from '#theme';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import type { SwitchProps as RNSwitchProps } from 'react-native';

export type SwitchProps = Omit<RNSwitchProps, 'onChange' | 'onValueChange'> & {
  variant?: 'large' | 'small';
  onValueChange?: (value: boolean) => void;
};

const Switch = ({ variant = 'small', style, ...props }: SwitchProps) => {
  const variantStyle = useVariantStyleSheet(computedStyle, variant);
  return (
    <RNSwitch
      {...props}
      style={[variantStyle.switch, style]}
      thumbColor={variantStyle.thumbColor.color}
      trackColor={{
        false: variantStyle.trackFalse.color,
        true: variantStyle.trackTrue.color,
      }}
    />
  );
};

export default Switch;

const computedStyle = createVariantsStyleSheet(appearance => ({
  default: {
    switch: {},
    trackTrue: {
      color: appearance === 'light' ? colors.black : colors.grey100,
    },
    trackFalse: {
      color: appearance === 'light' ? colors.grey200 : colors.grey800,
    },
    thumbColor: {
      color: appearance === 'light' ? colors.white : colors.black,
    },
  },
  small: {
    switch: { transform: [{ scaleX: 0.67 }, { scaleY: 0.71 }] },
  },
  large: {
    switch: {
      transform: [{ scaleX: 49 / 51 }, { scaleY: 31 / 32 }],
    },
  },
}));
