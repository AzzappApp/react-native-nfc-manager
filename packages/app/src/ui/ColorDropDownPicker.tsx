import { useState } from 'react';
import { useIntl } from 'react-intl';
import { View } from 'react-native';
import { swapColor } from '@azzapp/shared/cardHelpers';
import ColorPicker from './ColorPicker';
import FloatingButton from './FloatingButton';
import Text from './Text';
import type { FloatingButtonProps } from './FloatingButton';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';

export type ColorDropDownPickerProps = FloatingButtonProps & {
  /**
   * The currently selected color
   */
  color: string;
  /**
   * The color palette of the user
   */
  colorPalette: ColorPalette;
  /**
   * The list of available colors
   */
  colorList: readonly string[] | null;
  /**
   * The height of the bottom sheet
   */
  bottomSheetHeight: number;
  /**
   * A callback called when the user select a new color
   */
  onColorChange: (color: string) => void;
  /**
   * A callback called when the user update the color list
   */
  onUpdateColorList: (color: string[]) => void;
  /**
   * Called when the user update the color palette
   */
  onUpdateColorPalette: (colorPalette: ColorPalette) => void;
};

/**
 * A floating button that open a color picker when pressed
 */
export const ColorDropDownPicker = ({
  color,
  colorList,
  colorPalette,
  bottomSheetHeight,
  onColorChange,
  onUpdateColorList,
  onUpdateColorPalette,
  ...props
}: ColorDropDownPickerProps) => {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const intl = useIntl();

  return (
    <>
      <FloatingButton
        onPress={() => setColorPickerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Color',
          description: 'Label of the color button in cover edition',
        })}
        accessibilityHint={intl.formatMessage({
          defaultMessage: 'Tap to select a color',
          description: 'Hint of the color button in cover edition',
        })}
        {...props}
      >
        <Text
          style={{
            fontSize: 24,
            color: swapColor(color, colorPalette),
          }}
        >
          A
        </Text>
        <View
          style={{
            width: 25,
            height: 3,
            borderRadius: 4,
            backgroundColor: swapColor(color, colorPalette),
          }}
        />
      </FloatingButton>
      <ColorPicker
        title={intl.formatMessage({
          defaultMessage: 'Font color',
          description:
            'Title of the color picker modal in cover edition for font color',
        })}
        selectedColor={color}
        visible={colorPickerOpen}
        colorList={colorList}
        colorPalette={colorPalette}
        onRequestClose={() => setColorPickerOpen(false)}
        onColorChange={onColorChange}
        onUpdateColorList={onUpdateColorList}
        onUpdateColorPalette={onUpdateColorPalette}
        height={bottomSheetHeight}
      />
    </>
  );
};
