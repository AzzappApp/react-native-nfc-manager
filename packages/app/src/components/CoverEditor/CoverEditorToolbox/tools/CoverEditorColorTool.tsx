import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { swapColor } from '@azzapp/shared/cardHelpers';
import useBoolean from '#hooks/useBoolean';
import Icon from '#ui/Icon';
import ToolBoxSection from '../../../Toolbar/ToolBoxSection';
import {
  useCoverEditorContext,
  useCoverEditorEditContext,
  useCoverEditorLinksLayer,
  useCoverEditorTextLayer,
} from '../../CoverEditorContext';
import CoverEditorColorPicker from './CoverEditorColorPicker';

type Props = {
  title: string;
};

const CoverEditorColorTool = ({ title }: Props) => {
  const intl = useIntl();
  const [show, open, close] = useBoolean(false);

  const textLayer = useCoverEditorTextLayer();
  const linksLayer = useCoverEditorLinksLayer();

  const coverEditorState = useCoverEditorContext();
  const dispatch = useCoverEditorEditContext();

  const onColorChange = useCallback(
    (color: string) => {
      dispatch({
        type: 'UPDATE_CURRENT_LAYER_COLOR',
        payload: { color },
      });
    },
    [dispatch],
  );

  const selectedColor = textLayer?.color ?? linksLayer?.color ?? '#000';

  return (
    <>
      <ToolBoxSection
        label={intl.formatMessage({
          defaultMessage: 'Color',
          description: 'Cover Edition - Toolbox sub-menu - Color',
        })}
        icon={
          <>
            <Icon icon="font_color_letter" style={styles.icon} />
            <Icon
              icon="font_color_dash"
              style={{
                tintColor: swapColor(
                  selectedColor,
                  coverEditorState.cardColors,
                ),
              }}
            />
          </>
        }
        onPress={open}
      />

      <CoverEditorColorPicker
        visible={show}
        height={COLOR_PICKER_HEIGHT}
        title={title}
        selectedColor={selectedColor}
        canEditPalette
        onColorChange={onColorChange}
        onRequestClose={close}
      />
    </>
  );
};

const styles = StyleSheet.create({
  icon: {
    position: 'absolute',
  },
});

const COLOR_PICKER_HEIGHT = 380;

export default CoverEditorColorTool;
