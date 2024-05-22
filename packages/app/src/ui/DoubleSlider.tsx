import { Slider } from '@miblanchard/react-native-slider';
import { memo } from 'react';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';

type DoubleSliderProps = {
  minimumValue: number;
  maximumValue: number;
  value: [number, number];
  onValueChange: (value: number[], index: number) => void;
};

const DoubleSlider = (props: DoubleSliderProps) => {
  const styles = useStyleSheet(styleSheet);
  console.log(props.value);
  return (
    <Slider
      {...props}
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

export default memo(DoubleSlider);
