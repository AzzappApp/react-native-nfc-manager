import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import useToggle from '#hooks/useToggle';
import {
  useCoverEditorContext,
  useCoverEditorTextLayer,
} from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';
import CoverEditorColorPicker from './CoverEditorColorPicker';

const CoverEditorTextColorTool = () => {
  const intl = useIntl();
  const [show, toggleBottomSheet] = useToggle(false);

  const layer = useCoverEditorTextLayer();
  const { dispatch } = useCoverEditorContext();

  const onColorChange = useCallback(
    (color: string) => {
      dispatch({
        type: 'UPDATE_TEXT_LAYER',
        payload: { color },
      });
    },
    [dispatch],
  );

  // @TODO: might be another data source than text layer
  const selectedColor = layer?.color ?? '#000';

  return (
    <>
      <ToolBoxSection
        label={intl.formatMessage({
          defaultMessage: 'Color',
          description: 'Cover Edition - Toolbox sub-menu text - Color',
        })}
        icon={`font_color`}
        onPress={toggleBottomSheet}
      />

      <CoverEditorColorPicker
        visible={show}
        height={250}
        title={intl.formatMessage({
          defaultMessage: 'Text color',
          description: 'Text Color Picker title in Cover Editor',
        })}
        selectedColor={selectedColor}
        canEditPalette
        onColorChange={onColorChange}
        onRequestClose={toggleBottomSheet}
      />
    </>
  );
};

export default CoverEditorTextColorTool;
