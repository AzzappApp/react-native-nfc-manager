import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useToggle from '#hooks/useToggle';
import FontPicker from '#ui/FontPicker';
import ToolBoxSection from '#ui/ToolBoxSection';
import {
  useCoverEditorContext,
  useCoverEditorTextLayer,
} from '../CoverEditorContext';

const CoverEditorFontFamilyTool = () => {
  const intl = useIntl();
  const layer = useCoverEditorTextLayer();
  const { dispatch } = useCoverEditorContext();

  const [show, toggleBottomSheet] = useToggle(false);
  const { bottom } = useSafeAreaInsets();

  const currentFontFamily = layer?.style.fontFamily ?? '';
  const onFontFamilyChange = useCallback(
    (fontFamily: string) => {
      dispatch({
        type: 'CHANGE_FONT_FAMILY',
        payload: {
          fontFamily,
        },
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
        onPress={() => toggleBottomSheet()}
      />
      <FontPicker
        height={BOTTOM_SHEET_MODAL_HEIGHT + bottom}
        onChange={onFontFamilyChange}
        onRequestClose={toggleBottomSheet}
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
