import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { swapColor } from '@azzapp/shared/cardHelpers';
import useToggle from '#hooks/useToggle';
import Icon from '#ui/Icon';
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

  const { dispatch, coverEditorState } = useCoverEditorContext();

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
        onPress={toggleBottomSheet}
      />

      <CoverEditorColorPicker
        visible={show}
        height={COLOR_PICKER_HEIGHT}
        title={title}
        selectedColor={selectedColor}
        canEditPalette
        onColorChange={onColorChange}
        onRequestClose={toggleBottomSheet}
      />
    </>
  );
};

const styles = StyleSheet.create({
  icon: {
    position: 'absolute',
  },
});

const COLOR_PICKER_HEIGHT = 300;

export default CoverEditorColorTool;
