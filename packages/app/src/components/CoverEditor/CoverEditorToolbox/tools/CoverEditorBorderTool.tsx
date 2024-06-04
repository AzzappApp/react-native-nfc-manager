import { memo, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { swapColor } from '@azzapp/shared/cardHelpers';
import { DoneHeaderButton } from '#components/commonsButtons';
import useToggle from '#hooks/useToggle';
import BottomSheetModal from '#ui/BottomSheetModal';
import ColorPreview from '#ui/ColorPreview';
import LabeledWheelSelector from '#ui/LabeledWheelSelector';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import {
  useCoverEditorContext,
  useCoverEditorOverlayLayer,
} from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';
import CoverEditorColorPicker from './CoverEditorColorPicker';

const CoverEditorBorderTool = () => {
  const intl = useIntl();
  const [showBottomSheet, toggleBottomSheet] = useToggle(false);
  const [showColorPicker, toggleShowColorPicker] = useToggle(false);
  const {
    coverEditorState: { cardColors },
    dispatch,
  } = useCoverEditorContext();

  const layer = useCoverEditorOverlayLayer();
  const onChangeBorderRadius = useCallback(
    (borderRadius: number) => {
      dispatch({
        type: 'UPDATE_LAYER_BORDER',
        payload: { borderRadius },
      });
    },
    [dispatch],
  );

  const onChangeBorderWidth = useCallback(
    (borderWidth: number) => {
      dispatch({
        type: 'UPDATE_LAYER_BORDER',
        payload: { borderWidth },
      });
    },
    [dispatch],
  );

  const onColorChange = useCallback(
    (color: string) => {
      dispatch({
        type: 'UPDATE_LAYER_BORDER',
        payload: { borderColor: color },
      });
    },
    [dispatch],
  );

  return (
    <>
      <ToolBoxSection
        icon="border"
        label={intl.formatMessage({
          defaultMessage: 'Borders',
          description: 'Cover Edition Overlay Tool Button- Borders',
        })}
        onPress={toggleBottomSheet}
      />
      {layer != null && (
        <>
          <BottomSheetModal
            onRequestClose={toggleBottomSheet}
            visible={showBottomSheet && !showColorPicker}
            height={271}
            headerTitle={
              <Text variant="large">
                <FormattedMessage
                  defaultMessage="Borders"
                  description="CoverEditor Borders Tool - Title"
                />
              </Text>
            }
            headerRightButton={<DoneHeaderButton onPress={toggleBottomSheet} />}
          >
            <View style={{ rowGap: 10 }}>
              <LabeledWheelSelector
                min={0}
                max={100}
                step={1}
                interval={10}
                onChange={onChangeBorderRadius}
                value={layer.borderRadius as number}
                label={intl.formatMessage({
                  defaultMessage: 'Border radius: ',
                  description: 'Border radius label in cover edition border',
                })}
              />
              <LabeledWheelSelector
                min={0}
                max={10}
                step={0.5}
                interval={10}
                onChange={onChangeBorderWidth}
                value={layer.borderWidth as number}
                label={intl.formatMessage({
                  defaultMessage: 'Border size: ',
                  description: 'Border radius label in cover edition border',
                })}
              />
              <PressableOpacity
                onPress={toggleShowColorPicker}
                style={styles.colorPickerContainer}
              >
                <Text variant="small">
                  <FormattedMessage
                    defaultMessage="Border Color"
                    description="Border color label in cover edition border"
                  />
                </Text>
                <ColorPreview
                  color={swapColor(layer.borderColor, cardColors)}
                  colorSize={20}
                />
              </PressableOpacity>
            </View>
          </BottomSheetModal>
          <CoverEditorColorPicker
            visible={showColorPicker}
            height={250}
            title={intl.formatMessage({
              defaultMessage: 'Border Color',
              description: 'Border color Picker title in Cover Editor',
            })}
            selectedColor={layer.borderColor}
            canEditPalette
            onColorChange={onColorChange}
            onRequestClose={toggleShowColorPicker}
          />
        </>
      )}
    </>
  );
};

export default memo(CoverEditorBorderTool);

const styles = StyleSheet.create({
  colorPickerContainer: {
    alignItems: 'center',
    gap: 10,
    padding: 10,
  },
});
