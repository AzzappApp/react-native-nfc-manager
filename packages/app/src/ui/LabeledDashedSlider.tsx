import { StyleSheet, View } from 'react-native';
import DashedSlider from './DashedSlider';
import Text from './Text';
import type { DashedSliderProps } from './DashedSlider';
import type { ReactNode } from 'react';

export type LabeledDashedSliderProps = DashedSliderProps & {
  label: ReactNode;
};

const LabeledDashedSlider = ({
  label,
  variant,
  value,
  min,
  max,
  step,
  interval,
  onChange,
  ...props
}: LabeledDashedSliderProps) => (
  <View {...props}>
    <Text variant="small" style={styles.label}>
      {label}
    </Text>
    <DashedSlider
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

export default LabeledDashedSlider;

const styles = StyleSheet.create({
  label: {
    alignSelf: 'center',
    marginBottom: 5,
  },
});
