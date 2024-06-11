import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import useToggle from '#hooks/useToggle';
import {
  useCoverEditorContext,
  useCoverEditorLinksLayer,
  useCoverEditorTextLayer,
} from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';
import CoverEditorColorPicker from './CoverEditorColorPicker';

type Props = {
  title: string;
};

const CoverEditorColorTool = ({ title }: Props) => {
  const intl = useIntl();
  const [show, toggleBottomSheet] = useToggle(false);

  const textLayer = useCoverEditorTextLayer();
  const linksLayer = useCoverEditorLinksLayer();

  const { dispatch } = useCoverEditorContext();

  const onColorChange = useCallback(
    (color: string) => {
      dispatch({
        type: 'UPDATE_CURRENT_LAYER_COLOR',
        payload: { color },
      });
    },
    [dispatch],
  );

  // @TODO: might be another data source than text layer
  const selectedColor = textLayer?.color ?? linksLayer?.color ?? '#000';

  return (
    <>
      <ToolBoxSection
        label={intl.formatMessage({
          defaultMessage: 'Color',
          description: 'Cover Edition - Toolbox sub-menu - Color',
        })}
        icon={`font_color`}
        onPress={toggleBottomSheet}
      />

      <CoverEditorColorPicker
        visible={show}
        height={250}
        title={title}
        selectedColor={selectedColor}
        canEditPalette
        onColorChange={onColorChange}
        onRequestClose={toggleBottomSheet}
      />
    </>
  );
};

export default CoverEditorColorTool;
