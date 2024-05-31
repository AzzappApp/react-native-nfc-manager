import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { shadow } from '#theme';
import { DoneHeaderButton } from '#components/commonsButtons';
import { useOrdonedAnimation } from '#components/CoverRenderer/MediaAnimator';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useToggle from '#hooks/useToggle';
import BottomSheetModal from '#ui/BottomSheetModal';
import DoubleSlider from '#ui/DoubleSlider';
import LabeledWheelSelector from '#ui/LabeledWheelSelector';
import Text from '#ui/Text';
import ToolBoxSection from '#ui/ToolBoxSection';
import {
  useCoverEditorContext,
  useCoverEditorMedia,
  useCoverEditorOverlayLayer,
} from '../CoverEditorContext';
import { mediaInfoIsImage } from '../coverEditorHelpers';
import CoverEditorSelectionList, {
  BORDER_RADIUS_RATIO,
  BOX_WIDTH,
} from './CoverEditorSelectionList';
import type { MEDIA_ANIMATIONS } from '#components/CoverRenderer/MediaAnimator';

/**
 * This componet should handle the animation of an image (not user for video)
 * fort now, overlay and mediaImage
 *
 * @return {*}
 */
const CoverEditorAnimationTool = () => {
  const [show, toggleBottomSheet] = useToggle(false);
  const mediaInfo = useCoverEditorMedia();
  const overlay = useCoverEditorOverlayLayer();
  const {
    coverEditorState: { layerMode, medias },
  } = useCoverEditorContext();
  const { dispatch } = useCoverEditorContext();
  const animations = useOrdonedAnimation();
  const [animationId, setAnimationId] = useState('none');
  const [start, setStart] = useState(0);
  const [duration, setDuration] = useState(0);

  const totalDuration = useMemo(
    () =>
      medias.reduce(
        (acc, media) =>
          acc +
          (mediaInfoIsImage(media) ? media.duration : media.timeRange.duration),
        0,
      ),
    [medias],
  );

  useEffect(() => {
    if (layerMode === 'overlay' && overlay) {
      setStart(overlay.animation.start);
      setDuration(overlay.animation.duration);
      setAnimationId(overlay.animation.id);
    }
  }, [layerMode, overlay]);

  useEffect(() => {
    if (layerMode === 'mediaEdit' && mediaInfo?.media) {
      if (mediaInfoIsImage(mediaInfo)) {
        setDuration(mediaInfo.duration);
        setAnimationId(mediaInfo.animation);
      }
    }
  }, [layerMode, mediaInfo]);

  const onSelect = useCallback(
    (animation: string) =>
      dispatch({
        type: 'UPDATE_MEDIA_ANIMATION',
        payload: { start, duration, id: animation as MEDIA_ANIMATIONS },
      }),
    [dispatch, duration, start],
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
        type: 'UPDATE_MEDIA_ANIMATION',
        payload: {
          id: animationId,
          start: values[0],
          duration: values[1] - values[0],
        },
      });
    },
    [dispatch, animationId],
  );

  const onChangeDurationSlider = useCallback(
    (duration: number) => {
      dispatch({
        type: 'UPDATE_MEDIA_ANIMATION',
        payload: {
          id: animationId,
          start: 0,
          duration,
        },
      });
    },
    [dispatch, animationId],
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
      {(mediaInfo != null || overlay != null) && (
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
            selectedItemId={animationId}
          />
          {layerMode === 'overlay' && (
            <DoubleSlider
              minimumValue={0}
              maximumValue={totalDuration} //to define based on the duration of the total COVER which we dont have for now
              value={[start, duration + start]}
              onValueChange={onChangeDuration}
            />
          )}
          {layerMode === 'mediaEdit' && (
            <LabeledWheelSelector
              min={1} //TODO to be specified
              max={15} //TODO to be specified
              step={0.5}
              interval={15}
              onChange={onChangeDurationSlider}
              value={duration}
              label={intl.formatMessage({
                defaultMessage: 'Duration: ',
                description: 'Duration label in cover edition animation',
              })}
            />
          )}
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
