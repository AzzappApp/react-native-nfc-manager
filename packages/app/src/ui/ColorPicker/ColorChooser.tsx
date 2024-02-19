import chroma from 'chroma-js';
import clamp from 'lodash/clamp';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDebouncedCallback } from 'use-debounce';
import HuePicker from './HuePicker';
import RGBHexColorPicker from './RGBHexColorPicker';
import SaturationValuePicker from './SaturationValuePicker';
import type { StyleProp, ViewStyle } from 'react-native';

export type ColorChooserProps = {
  value: string;
  onColorChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
};

const ColorChooser = ({ value, onColorChange, style }: ColorChooserProps) => {
  const [hsv, setHsv] = useState({
    hue: hexToHSV(value)[0],
    saturation: hexToHSV(value)[1],
    value: hexToHSV(value)[2],
  });

  const onColorChangeDebounced = useDebouncedCallback(onColorChange, 200);

  const onSatValChange = useCallback(
    ([saturation, value]: [number, number]) => {
      setHsv(prev => {
        return {
          ...prev,
          saturation: clamp(saturation, 0, 1),
          value: clamp(value, 0, 1),
        };
      });
      onColorChangeDebounced(chroma.hsv(hsv.hue, saturation, value).hex());
    },
    [hsv.hue, onColorChangeDebounced],
  );

  const onHueChange = useCallback(
    (hue: number) => {
      setHsv(prev => {
        return { ...prev, hue };
      });
      onColorChangeDebounced(chroma.hsv(hue, hsv.saturation, hsv.value).hex());
    },
    [hsv.saturation, hsv.value, onColorChangeDebounced],
  );

  const onHexChange = useCallback(
    (hex: string) => {
      setHsv({
        hue: hexToHSV(hex)[0],
        saturation: hexToHSV(hex)[1],
        value: hexToHSV(hex)[2],
      });
      onColorChange(hex);
    },
    [onColorChange],
  );

  return (
    <View style={style}>
      <SaturationValuePicker
        hue={hsv.hue}
        value={[hsv.saturation, hsv.value]}
        onChange={onSatValChange}
        style={styles.saturationValuePicker}
      />
      <HuePicker
        value={hsv.hue}
        onChange={onHueChange}
        style={styles.huePicker}
      />
      <RGBHexColorPicker
        hue={hsv.hue}
        value={[hsv.saturation, hsv.value]}
        onChange={onHexChange}
      />
    </View>
  );
};

export default ColorChooser;

const styles = StyleSheet.create({
  saturationValuePicker: {
    height: 117,
    borderRadius: 20,
  },
  huePicker: {
    borderRadius: 4,
    marginTop: 20,
    marginBottom: 30,
  },
});

const hexToHSV = (color: string) => {
  let [hue, saturation, value] = [180, 0.5, 1];
  try {
    [hue, saturation, value] = chroma(color).hsv();
    // eslint-disable-next-line no-empty
  } catch {}

  if (Number.isNaN(hue)) {
    hue = 0;
  }

  return [hue, saturation, value];
};
