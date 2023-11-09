import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import AnimatedText from '#components/AnimatedText';
import DashedSlider, { getClampedValue } from './DashedSlider';
import Text from './Text';
import type { DashedSliderProps } from './DashedSlider';

export type LabeledDashedSliderProps = Omit<
  DashedSliderProps,
  'sharedValue'
> & {
  label?: ReactNode;
  initialValue: number;
  formatValue?: (value: number) => number;
};

const LabeledDashedSlider = ({
  label,
  variant,
  initialValue,
  min,
  max,
  step,
  interval,
  onChange,
  formatValue,
  ...props
}: LabeledDashedSliderProps) => {
  const sharedValue = useSharedValue(initialValue);

  const textValue = useDerivedValue(() => {
    return formatValue
      ? `${formatValue(getClampedValue(sharedValue.value, step, min, max))}`
      : ` ${getClampedValue(sharedValue.value, step, min, max)}`;
  }, [sharedValue, formatValue]);

  return (
    <View {...props}>
      <View style={styles.label}>
        {label && <Text variant="small">{label}</Text>}
        <AnimatedText text={textValue} variant="small" />
      </View>
      <DashedSlider
        variant={variant}
        sharedValue={sharedValue}
        min={min}
        max={max}
        step={step}
        interval={interval}
        onChange={onChange}
      />
    </View>
  );
};

export default LabeledDashedSlider;

const styles = StyleSheet.create({
  label: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 5,
  },
});
