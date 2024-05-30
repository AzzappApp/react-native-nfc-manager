import { memo, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { shadow } from '#theme';
import { DoneHeaderButton } from '#components/commonsButtons';
import { useOrdonedAnimation } from '#components/CoverRenderer/MediaAnimator';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useToggle from '#hooks/useToggle';
import BottomSheetModal from '#ui/BottomSheetModal';
import DoubleSlider from '#ui/DoubleSlider';
import Text from '#ui/Text';
import ToolBoxSection from '#ui/ToolBoxSection';
import {
  useCoverEditorContext,
  useCoverEditorOverlayLayer,
} from '../CoverEditorContext';
import CoverEditorSelectionList, {
  BORDER_RADIUS_RATIO,
  BOX_WIDTH,
} from './CoverEditorSelectionList';
import type { MEDIA_ANIMATIONS } from '#components/CoverRenderer/MediaAnimator';
const CoverEditorAnimationTool = () => {
  const [show, toggleBottomSheet] = useToggle(false);
  const layer = useCoverEditorOverlayLayer(); //use directly the layer for now, only one animated
  const { dispatch } = useCoverEditorContext();
  const animations = useOrdonedAnimation();

  const onSelect = useCallback(
    (animation: string) => {
      dispatch({
        type: 'UPDATE_LAYER_ANIMATION',
        payload: { id: animation },
      });
    },
    [dispatch],
  );

  const renderItem = useCallback(
    (item: { id: MEDIA_ANIMATIONS; label: string }) => {
      return <AnimationOverlay animation={item.id} />;
    },
    [],
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onChangeDuration = useCallback(
    (values: number[], _index: number) => {
      dispatch({
        type: 'UPDATE_LAYER_ANIMATION',
        payload: { start: values[0], end: values[1] },
      });
    },
    [dispatch],
  );

  const intl = useIntl();
  return (
    <>
      <ToolBoxSection
        icon="animate"
        label={intl.formatMessage({
          defaultMessage: 'Animations',
          description: 'Cover Edition Overlay Tool Button- Borders',
        })}
        onPress={toggleBottomSheet}
      />
      {layer != null && (
        <BottomSheetModal
          onRequestClose={toggleBottomSheet}
          visible={show}
          height={284}
          headerTitle={
            <Text variant="large">
              <FormattedMessage
                defaultMessage="Animations (TODO define them with skia)"
                description="CoverEditor Animations Tool - Title"
              />
            </Text>
          }
          headerRightButton={<DoneHeaderButton onPress={toggleBottomSheet} />}
        >
          <CoverEditorSelectionList
            data={animations}
            renderItem={renderItem}
            accessibilityRole="list"
            onSelect={onSelect}
            selectedItemId={layer?.animation?.id ?? 'none'}
          />
          <DoubleSlider
            minimumValue={0}
            maximumValue={500} //to define based on the duration of the total COVER which we dont have for now
            value={[layer.animation?.start ?? 0, layer.animation?.end ?? 500]}
            onValueChange={onChangeDuration}
          />
        </BottomSheetModal>
      )}
    </>
  );
};

export default memo(CoverEditorAnimationTool);

type AnimationSampleProps = {
  animation: MEDIA_ANIMATIONS;
};

const AnimationOverlay = (_props: AnimationSampleProps) => {
  const styles = useStyleSheet(styleSheet);
  return (
    <View style={styles.itemPreview}>
      {/* TODO: use animation when we will have them defined, so maybe create  a canvas SKIA here */}
      {/* <Image
        style={{ width: BOX_WIDTH, aspectRatio: 1, borderRadius: 7 }}
        source={{ uri }}
      /> */}
    </View>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  itemPreview: {
    width: BOX_WIDTH,
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS_RATIO,
    overflow: 'hidden',
    ...shadow(appearance, 'bottom'),
  },
}));
