import { Slider } from '@miblanchard/react-native-slider';
import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';

type DoubleSliderProps = {
  minimumValue: number;
  maximumValue: number;
  value: number[];
  onValueChange: (value: number[]) => void;
  step?: number;
};

const DoubleSlider = ({
  value: initialValue,
  minimumValue,
  maximumValue,
  step,
  onValueChange,
}: DoubleSliderProps) => {
  const styles = useStyleSheet(styleSheet);

  const [value, setValue] = useState<number[]>(initialValue);

  const [debounced] = useDebounce(value, 300);

  useEffect(() => {
    onValueChange(debounced);
  }, [debounced, onValueChange]);

  const onValueChangeInner = useCallback(
    (newValue: number[], index: number) => {
      setValue(val => {
        const newValueCopy = [...val];
        newValueCopy[index] = newValue[index];
        return newValueCopy;
      });
    },
    [],
  );

  return (
    <Slider
      value={value}
      minimumValue={minimumValue}
      maximumValue={maximumValue}
      step={step}
      onValueChange={onValueChangeInner}
      trackStyle={styles.trackStyle}
      thumbStyle={styles.thumbStyle}
      minimumTrackStyle={styles.minimumTrackStyle}
    />
  );
};

const styleSheet = createStyleSheet(appearance => ({
  trackStyle: {
    height: 2,
    borderRadius: 20,
    backgroundColor: appearance === 'light' ? colors.grey100 : colors.grey800,
  },
  thumbStyle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
  },
  minimumTrackStyle: {
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
  },
}));

export default DoubleSlider;
