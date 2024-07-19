import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import AnimatedText from '#components/AnimatedText';
import Text from './Text';
import WheelSelector from './WheelSelector';
import type { DashedSliderProps } from './DashedSlider';

export type LabeledDashedSliderProps = Omit<
  DashedSliderProps,
  'sharedValue'
> & {
  label: string;
  value: number;
  variant?: 'default' | 'small';
  min: number;
  max: number;
  step: number;
  interval?: number;
  onChange?: (value: number) => void;
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
}: LabeledDashedSliderProps) => {
  const animatedValue = useSharedValue(`${value}`);

  return (
    <View {...props}>
      <View style={styles.label}>
        {label && (
          <Text variant="small" style={styles.text}>
            {label}
          </Text>
        )}
        <AnimatedText
          text={animatedValue}
          variant="small"
          style={styles.text}
        />
      </View>
      <WheelSelector
        variant={variant}
        value={value}
        min={min}
        max={max}
        step={step}
        interval={interval}
        onChange={onChange}
        animatedValue={animatedValue}
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
