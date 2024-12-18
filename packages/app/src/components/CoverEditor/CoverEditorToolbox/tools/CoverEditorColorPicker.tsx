import { useCallback } from 'react';
import {
  useCoverEditorContext,
  useCoverEditorEditContext,
} from '#components/CoverEditor/CoverEditorContext';
import ColorPicker from '#ui/ColorPicker';
import type { ColorPickerProps } from '#ui/ColorPicker';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';

type CoverEditorColorPickerProps = Omit<
  ColorPickerProps,
  'colorList' | 'colorPalette' | 'onUpdateColorList' | 'onUpdateColorPalette'
>;

const CoverEditorColorPicker = (props: CoverEditorColorPickerProps) => {
  const { cardColors } = useCoverEditorContext();
  const dispatch = useCoverEditorEditContext();

  const onUpdateColorList = useCallback(
    (otherColors: string[]) => {
      dispatch({
        type: 'UPDATE_CARD_COLORS',
        payload: {
          ...cardColors,
          otherColors,
        },
      });
    },
    [cardColors, dispatch],
  );

  const onUpdateColorPalette = useCallback(
    (colorPalete: ColorPalette) => {
      dispatch({
        type: 'UPDATE_CARD_COLORS',
        payload: {
          ...cardColors,
          ...colorPalete,
        },
      });
    },
    [cardColors, dispatch],
  );

  return (
    <ColorPicker
      {...props}
      colorPalette={cardColors}
      colorList={cardColors.otherColors}
      onUpdateColorList={onUpdateColorList}
      onUpdateColorPalette={onUpdateColorPalette}
    />
  );
};

export default CoverEditorColorPicker;
