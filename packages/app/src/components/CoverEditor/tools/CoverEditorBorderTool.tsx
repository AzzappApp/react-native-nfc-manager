import { memo, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { DoneHeaderButton } from '#components/commonsButtons';
import useScreenInsets from '#hooks/useScreenInsets';
import useToggle from '#hooks/useToggle';
import BottomSheetModal from '#ui/BottomSheetModal';
import LabeledWheelSelector from '#ui/LabeledWheelSelector';
import Text from '#ui/Text';
import ToolBoxSection from '#ui/ToolBoxSection';
import { CoverEditorActionType } from '../coverEditorActions';
import {
  useCoverEditorContext,
  useCoverEditorOverlayLayer,
} from '../CoverEditorContext';

const CoverEditorBorderTool = () => {
  const intl = useIntl();
  const { bottom } = useScreenInsets();
  const [show, toggleBottomSheet] = useToggle(false);
  const { dispatch } = useCoverEditorContext();
  const save = () => {
    toggleBottomSheet();
  };
  const layer = useCoverEditorOverlayLayer();
  const onChangeBorderRadius = useCallback(
    (borderRadius: number) => {
      dispatch({
        type: CoverEditorActionType.UpdateLayerBorder,
        payload: { borderRadius },
      });
    },
    [dispatch],
  );

  const onChangeBorderWidth = useCallback(
    (borderWidth: number) => {
      dispatch({
        type: CoverEditorActionType.UpdateLayerBorder,
        payload: { borderWidth },
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
        <BottomSheetModal
          onRequestClose={toggleBottomSheet}
          visible={show}
          height={bottom + 271}
          headerTitle={
            <Text variant="large">
              <FormattedMessage
                defaultMessage="Borders"
                description="CoverEditor Borders Tool - Title"
              />
            </Text>
          }
          headerRightButton={<DoneHeaderButton onPress={save} />}
        >
          <View style={{ rowGap: 10 }}>
            <LabeledWheelSelector
              min={0}
              max={100}
              step={1}
              interval={10}
              onChange={onChangeBorderRadius}
              value={layer.style.borderRadius as number}
              label={intl.formatMessage({
                defaultMessage: 'Border radius: ',
                description: 'Border radius label in cover edition border',
              })}
            />
            <LabeledWheelSelector
              min={0}
              max={100}
              step={1}
              interval={10}
              onChange={onChangeBorderWidth}
              value={layer.style.borderWidth as number}
              label={intl.formatMessage({
                defaultMessage: 'Border size: ',
                description: 'Border radius label in cover edition border',
              })}
            />
          </View>
        </BottomSheetModal>
      )}
    </>
  );
};

export default memo(CoverEditorBorderTool);
