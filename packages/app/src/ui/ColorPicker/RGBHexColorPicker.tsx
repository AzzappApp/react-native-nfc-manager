import chroma from 'chroma-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import BottomSheetTextInput from '#ui/BottomSheetTextInput';
import Label from '#ui/Label';
import HexColorTextInput from '../HexColorTextInput';

type RGBHexColorPickerProps = {
  hue: number;
  value: [saturation: number, value: number];
  /**
   * callback onChnage  passing the  color in hex format.
   *
   * @param {string} hexColor
   */
  onChange(hexColor: string): void;
};
const RGBHexColorPicker = ({
  hue,
  value: [saturation, value],
  onChange,
}: RGBHexColorPickerProps) => {
  const intl = useIntl();
  const chromaColorRgb = useRef(chroma.hsv(hue, saturation, value).rgb());
  // we need a local color in case the user clear the input before typing a new one and is not a valid color
  const [localColor, setLocalColor] = useState(() => {
    const chromaColor = chroma.hsv(hue, saturation, value);
    return {
      red: String(chromaColor.rgb()[0]),
      green: String(chromaColor.rgb()[1]),
      blue: String(chromaColor.rgb()[2]),
    };
  });

  useEffect(() => {
    const chromCol = chroma.hsv(hue, saturation, value).rgb();
    // chroma object will always return a new reference,  caompare it with the hex value
    if (
      chromCol &&
      (chromaColorRgb.current[0] !== chromCol[0] ||
        chromaColorRgb.current[1] !== chromCol[1] ||
        chromaColorRgb.current[2] !== chromCol[2])
    ) {
      chromaColorRgb.current = chromCol;
      setLocalColor(localColor =>
        localColor.red !== String(chromCol[0]) &&
        localColor.green !== String(chromCol[1]) &&
        localColor.blue !== String(chromCol[2])
          ? {
              red: String(chromCol[0]),
              green: String(chromCol[1]),
              blue: String(chromCol[2]),
            }
          : localColor,
      );
    }
  }, [hue, saturation, value]);

  const onChangeRed = useCallback(
    (color: string) => {
      if (color === '') {
        //do not propagate the change on not valid color
        setLocalColor(prev => ({ ...prev, red: '' }));
      } else if (!isNaN(+color)) {
        const red = Math.min(parseInt(color, 10), 255);
        const previous = chromaColorRgb.current[0];
        if (previous === red) {
          // case when we clear the input and reset the exact same value
          setLocalColor(prev => ({ ...prev, red: String(red) }));
          return;
        }
        setLocalColor(prev => ({ ...prev, red: String(red) }));
        chromaColorRgb.current[0] = red;
        onChange(
          chroma
            .rgb(
              red,
              parseInt(localColor.green, 10),
              parseInt(localColor.blue, 10),
            )
            .hex(),
        );
      }
    },
    [localColor.blue, localColor.green, onChange],
  );

  const onEndSubmittingRed = useCallback(() => {
    if (localColor.red === '') {
      setLocalColor(prev => ({
        ...prev,
        red: String(chromaColorRgb.current[0]),
      }));
    }
  }, [localColor.red]);

  const onChangeGreen = useCallback(
    (color: string) => {
      if (color === '') {
        setLocalColor(prev => ({ ...prev, green: '' }));
      } else if (!isNaN(+color)) {
        const green = Math.min(parseInt(color, 10), 255);
        const previous = chromaColorRgb.current[1];
        if (previous === green) {
          setLocalColor(prev => ({ ...prev, green: String(green) }));
          return;
        }
        setLocalColor(prev => ({ ...prev, green: String(green) }));
        chromaColorRgb.current[1] = green;
        onChange(
          chroma
            .rgb(
              parseInt(localColor.red, 10),
              green,
              parseInt(localColor.blue, 10),
            )
            .hex(),
        );
      }
    },
    [localColor.blue, localColor.red, onChange],
  );

  const onEndSubmittingGreen = useCallback(() => {
    if (localColor.green === '') {
      setLocalColor(prev => ({
        ...prev,
        green: String(chromaColorRgb.current[1]),
      }));
    }
  }, [localColor.green]);

  const onChangeBlue = useCallback(
    (color: string) => {
      if (color === '') {
        setLocalColor(prev => ({ ...prev, blue: '' }));
      } else if (!isNaN(+color)) {
        const blue = Math.min(parseInt(color, 10), 255);
        const previous = chromaColorRgb.current[2];
        if (previous === blue) {
          setLocalColor(prev => ({ ...prev, blue: String(blue) }));
          return;
        }
        setLocalColor(prev => ({ ...prev, blue: String(blue) }));
        chromaColorRgb.current[2] = blue;
        onChange(
          chroma
            .rgb(
              parseInt(localColor.red, 10),
              parseInt(localColor.green, 10),
              blue,
            )
            .hex(),
        );
      }
    },
    [localColor.green, localColor.red, onChange],
  );

  const onEndSubmittingBlue = useCallback(() => {
    if (localColor.blue === '') {
      setLocalColor(prev => ({
        ...prev,
        blue: String(chroma.hsv(hue, saturation, value).rgb()[2]),
      }));
    }
  }, [hue, localColor.blue, saturation, value]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      <HexColorTextInput
        testID="hexColorTextInput"
        style={{ marginTop: 0 }}
        value={chroma.hsv(hue, saturation, value).hex().toUpperCase()}
        onColorChange={onChange}
      />

      <Label
        labelID="RGB"
        label={intl.formatMessage({
          defaultMessage: 'RGB',
          description: 'ColorPicker Component - TextInput Label : RGB Title',
        })}
        showError={false}
        style={styles.flex}
      >
        <BottomSheetTextInput
          testID="red"
          accessibilityLabelledBy="RGB"
          value={localColor.red}
          onChangeText={onChangeRed}
          onEndEditing={onEndSubmittingRed}
          autoCapitalize="none"
          autoComplete="off"
          keyboardType="number-pad"
          autoCorrect={false}
          style={styles.textInputStyle}
        />
      </Label>
      <View style={styles.viewgb}>
        <BottomSheetTextInput
          testID="green"
          accessibilityLabelledBy="RGB"
          value={localColor.green}
          onChangeText={onChangeGreen}
          onEndEditing={onEndSubmittingGreen}
          autoCapitalize="none"
          autoComplete="off"
          keyboardType="number-pad"
          autoCorrect={false}
          style={styles.textInputStyle}
        />
        <BottomSheetTextInput
          testID="blue"
          accessibilityLabelledBy="RGB"
          value={localColor.blue}
          onChangeText={onChangeBlue}
          onEndEditing={onEndSubmittingBlue}
          autoCapitalize="none"
          autoComplete="off"
          keyboardType="number-pad"
          autoCorrect={false}
          style={styles.textInputStyle}
        />
      </View>
    </View>
  );
};

export default RGBHexColorPicker;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  viewgb: {
    flex: 2,
    flexDirection: 'row',
  },
  textInputStyle: {
    flex: 1,
    marginRight: 10,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingHorizontal: 10,
    maxHeight: 47,
  },
});
