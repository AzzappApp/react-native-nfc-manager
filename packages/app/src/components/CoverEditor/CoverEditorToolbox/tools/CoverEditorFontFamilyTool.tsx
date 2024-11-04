import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import useBoolean from '#hooks/useBoolean';
import FontPicker from '#ui/FontPicker';
import {
  useCoverEditorContext,
  useCoverEditorTextLayer,
} from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';

const CoverEditorFontFamilyTool = () => {
  const intl = useIntl();
  const layer = useCoverEditorTextLayer();
  const { dispatch } = useCoverEditorContext();

  const [show, open, close] = useBoolean(false);

  const currentFontFamily = layer?.fontFamily ?? '';
  const onFontFamilyChange = useCallback(
    (fontFamily: string) => {
      dispatch({
        type: 'UPDATE_TEXT_LAYER',
        payload: { fontFamily },
      });
    },
    [dispatch],
  );
  return (
    <>
      <ToolBoxSection
        label={intl.formatMessage({
          defaultMessage: 'Font',
          description: 'Cover Edition - Toolbox sub-menu text - Font',
        })}
        icon="font"
        onPress={open}
      />
      <FontPicker
        height={BOTTOM_SHEET_MODAL_HEIGHT}
        onChange={onFontFamilyChange}
        onRequestClose={close}
        title={intl.formatMessage({
          defaultMessage: 'Font family',
          description: 'CoverEditorFontFamilyTool - Modal - Title',
        })}
        value={currentFontFamily}
        visible={show}
      />
    </>
  );
};

const BOTTOM_SHEET_MODAL_HEIGHT = 265;
export default CoverEditorFontFamilyTool;
