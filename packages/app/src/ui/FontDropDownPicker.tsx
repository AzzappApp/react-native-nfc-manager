import { useState } from 'react';
import { useIntl } from 'react-intl';
import FloatingButton from './FloatingButton';
import FontPicker from './FontPicker';
import Text from './Text';
import type { FloatingButtonProps } from './FloatingButton';

export type FontDropDownPickerProps = FloatingButtonProps & {
  /**
   * The currently selected font family
   */
  fontFamily: string;
  /**
   * A callback called when the user select a new font family
   */
  onFontFamilyChange: (fontFamily: string) => void;
  /**
   * The height of the bottom sheet
   */
  bottomSheetHeight: number;
};

/**
 * A floating button that open a font picker when pressed
 */
const FontDropDownPicker = ({
  fontFamily,
  onFontFamilyChange,
  bottomSheetHeight,
  ...props
}: FontDropDownPickerProps) => {
  const intl = useIntl();
  const [fontPickerOpen, setFontPickerOpen] = useState(false);

  return (
    <>
      <FloatingButton
        accessibilityRole="button"
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Font',
          description: 'Label of the ont dropdown button',
        })}
        accessibilityHint={intl.formatMessage({
          defaultMessage: 'Tap to select a font',
          description: 'Hint of the font dropdown button',
        })}
        onPress={() => {
          setFontPickerOpen(true);
        }}
        {...props}
      >
        <Text
          style={{
            fontSize: 21,
            fontFamily,
          }}
        >
          abc
        </Text>
      </FloatingButton>
      <FontPicker
        title={intl.formatMessage({
          defaultMessage: 'Font family',
          description: 'Title of the font picker modal in cover edition',
        })}
        value={fontFamily as any}
        visible={fontPickerOpen}
        onRequestClose={() => setFontPickerOpen(false)}
        onChange={onFontFamilyChange}
        height={bottomSheetHeight}
      />
    </>
  );
};

export default FontDropDownPicker;
