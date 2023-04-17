import { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { colors } from '#theme';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import type { PressableProps } from 'react-native';

type RadioButtonProps = Omit<PressableProps, 'onPress' | 'style'> & {
  checked: boolean;
  variant?: 'large' | 'small';
  onChange: (val: boolean) => void;
};

const RadioButton = ({
  checked = true,
  variant = 'large',
  onChange,
  ...props
}: RadioButtonProps) => {
  const styles = useVariantStyleSheet(variantStyles, variant);

  const onPress = useCallback(() => {
    onChange(!checked);
  }, [checked, onChange]);

  return (
    <Pressable
      style={[styles.outerRing, checked && styles.outerRingChecked]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked }}
      {...props}
    >
      <View style={[styles.innerRing, checked && styles.innerRingChecked]} />
    </Pressable>
  );
};

const variantStyles = createVariantsStyleSheet(appearance => ({
  default: {
    outerRing: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: appearance === 'light' ? colors.grey100 : colors.grey800,
      backgroundColor: appearance === 'light' ? colors.white : colors.white,
    },
    outerRingChecked: {
      borderColor: appearance === 'light' ? colors.black : colors.grey100,
      backgroundColor: appearance === 'light' ? colors.black : colors.grey100,
    },
    innerRing: {
      backgroundColor: appearance === 'light' ? colors.grey100 : colors.grey800,
    },
    innerRingChecked: {
      backgroundColor: appearance === 'light' ? colors.white : colors.white,
    },
  },
  large: {
    outerRing: {
      width: 18,
      height: 18,
      borderRadius: 9,
    },
    innerRing: {
      width: 8.8,
      height: 8.8,
      borderRadius: 4.4,
    },
  },
  small: {
    outerRing: {
      width: 14.4,
      height: 14.4,
      borderRadius: 7.2,
    },
    innerRing: {
      width: 7.04,
      height: 7.04,
      borderRadius: 3.52,
    },
  },
}));

export default RadioButton;
