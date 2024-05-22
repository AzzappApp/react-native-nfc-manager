import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';
import AnimatedText from '#components/AnimatedText';
import { getClampedValue } from './DashedSlider';
import Text from './Text';
import WheelSelector from './WheelSelector';
import type { DashedSliderProps } from './DashedSlider';

export type LabeledDashedSliderProps = Omit<
  DashedSliderProps,
  'sharedValue'
> & {
  label?: ReactNode;
  value: number;
  formatValue?: (value: number) => number | string;
};

function getPrecision(a: number) {
  'worklet';
  if (!isFinite(a)) return 0;
  let e = 1;
  let p = 0;
  while (Math.round(a * e) / e !== a) {
    e *= 10;
    p++;
  }
  return p;
}

const LabeledDashedSlider = ({
  label,
  variant,
  value,
  min,
  max,
  step,
  interval,
  formatValue,
  onTouched,
  onChange,
  ...props
}: LabeledDashedSliderProps) => {
  const textValue = useDerivedValue(() => {
    return formatValue
      ? `${formatValue(getClampedValue(value, step, min, max))}`
      : getClampedValue(value, step, min, max).toFixed(getPrecision(step));
  }, [value, formatValue]);

  return (
    <View {...props}>
      <View style={styles.label}>
        {label && (
          <Text variant="small" style={styles.text}>
            {label}
          </Text>
        )}
        <AnimatedText text={textValue} variant="small" style={styles.text} />
      </View>
      <WheelSelector
        variant={variant}
        value={value}
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
  text: {
    textAlign: 'center',
    transform: [{ translateX: -1 }],
  },
});
