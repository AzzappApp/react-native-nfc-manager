import {
  createPicture,
  Canvas,
  Picture,
  Skia,
} from '@shopify/react-native-skia';
import { memo, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import {
  useSharedValue,
  useFrameCallback,
  useDerivedValue,
} from 'react-native-reanimated';
import {
  COVER_MIN_MEDIA_DURATION,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import BoxSelectionList from '#components/BoxSelectionList';
import { DoneHeaderButton } from '#components/commonsButtons';
import overlayAnimations, {
  useOverlayAnimationList,
} from '#components/CoverEditor/coverDrawer/overlayAnimations';
import { mediaInfoIsImage } from '#components/CoverEditor/coverEditorHelpers';
import TransformedImageRenderer from '#components/TransformedImageRenderer';
import { keyExtractor } from '#helpers/idHelpers';
import {
  createImageFromNativeBuffer,
  transformImage,
  useLutShader,
  useNativeBuffer,
} from '#helpers/mediaEditions';
import useToggle from '#hooks/useToggle';
import BottomSheetModal from '#ui/BottomSheetModal';
import DoubleSlider from '#ui/DoubleSlider';
import Text from '#ui/Text';
import {
  useCoverEditorContext,
  useCoverEditorOverlayLayer,
} from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';

import type { BoxButtonItemInfo } from '#components/BoxSelectionList';
import type {
  OverlayAnimationListItem,
  OverlayAnimations,
} from '#components/CoverEditor/coverDrawer/overlayAnimations';
import type { EditionParameters } from '#helpers/mediaEditions';
import type { SkImage, SkShader } from '@shopify/react-native-skia';
import type { DerivedValue } from 'react-native-reanimated';

const MIN_DURATION_ANIMATION = 0.5;
const CoverEditorOverlayImageAnimationTool = () => {
  const [show, toggleBottomSheet] = useToggle(false);
  const activeOverlay = useCoverEditorOverlayLayer();
  const medias = useCoverEditorContext().coverEditorState.medias;

  const { dispatch } = useCoverEditorContext();
  const animations = useOverlayAnimationList();

  const totalDuration = medias.reduce((acc, media) => {
    if (mediaInfoIsImage(media)) {
      return acc + media.duration;
    } else {
      return acc + media.timeRange.duration;
    }
  }, 0);

  const onChangeAnimationDuration = useCallback(
    (value: number[], index: number) => {
      if (activeOverlay) {
        //duration should be at minimum COVER_MIN_MEDIA_DURATION
        const duration = value[1] - value[0];
        let start = value[0];
        let end = value[1];
        if (duration < COVER_MIN_MEDIA_DURATION) {
          if (index === 0) {
            //left slider is moving
            start = Math.min(end - MIN_DURATION_ANIMATION, start);
          } else {
            end = Math.max(start + MIN_DURATION_ANIMATION, end);
          }
        }

        const startPercent = start / totalDuration;
        const endPercent = end / totalDuration;

        dispatch({
          type: 'UPDATE_OVERLAY_LAYER',
          payload: {
            startPercentageTotal: startPercent,
            endPercentageTotal: endPercent,
          },
        });
      }
    },
    [activeOverlay, dispatch, totalDuration],
  );

  const onSelect = useCallback(
    (anim: OverlayAnimationListItem | null) => {
      dispatch({
        type: 'UPDATE_OVERLAY_LAYER',
        payload: { animation: anim?.id ?? null },
      });
    },
    [dispatch],
  );

  const buffer = useNativeBuffer({
    uri: activeOverlay?.media?.uri,
    kind: activeOverlay?.media?.kind,
  });

  const skImage = useDerivedValue(() => {
    if (!buffer) {
      return null;
    }
    return createImageFromNativeBuffer(buffer, true);
  }, [buffer]);

  const intl = useIntl();
  const renderLabel = useCallback(
    ({ item }: BoxButtonItemInfo<OverlayAnimationListItem>) =>
      item
        ? item?.label
        : intl.formatMessage({
            defaultMessage: 'None',
            description: 'Cover Edition Animation - None',
          }),
    [intl],
  );

  const lutShader = useLutShader(activeOverlay?.filter);

  const renderItem = useCallback(
    ({
      item,
      height,
      width,
    }: BoxButtonItemInfo<OverlayAnimationListItem | null>) => {
      if (item && activeOverlay && skImage) {
        return (
          <AnimationPreview
            animationId={item.id}
            height={height}
            width={width}
            skImage={skImage}
            editionParameters={activeOverlay.editionParameters}
            duration={4}
            lutShader={lutShader}
          />
        );
      }
      return (
        <TransformedImageRenderer
          testID="image-picker-media-image"
          image={skImage}
          height={height}
          width={width}
          filter={activeOverlay?.filter}
          editionParameters={activeOverlay?.editionParameters}
        />
      );
    },
    [activeOverlay, lutShader, skImage],
  );

  return (
    <>
      <ToolBoxSection
        icon="animate"
        label={intl.formatMessage({
          defaultMessage: 'Animations',
          description:
            'Cover Edition Image Overlay animation Tool Button - Animations',
        })}
        onPress={toggleBottomSheet}
      />
      {activeOverlay != null && (
        <BottomSheetModal
          lazy
          onRequestClose={toggleBottomSheet}
          visible={show}
          height={210 + 80 / COVER_RATIO}
          headerTitle={
            <Text variant="large">
              <FormattedMessage
                defaultMessage="Animations "
                description="CoverEditor Animations Tool - Title"
              />
            </Text>
          }
          headerRightButton={<DoneHeaderButton onPress={toggleBottomSheet} />}
        >
          <View style={styles.boxContainer}>
            <BoxSelectionList
              data={animations}
              renderItem={renderItem}
              renderLabel={renderLabel}
              keyExtractor={keyExtractor}
              accessibilityRole="list"
              onSelect={onSelect}
              imageRatio={COVER_RATIO}
              selectedItem={
                animations.find(item => item.id === activeOverlay.animation) ??
                null
              }
            />
          </View>
          <DoubleSlider
            minimumValue={0}
            maximumValue={totalDuration}
            value={[
              activeOverlay.startPercentageTotal * totalDuration,
              activeOverlay.endPercentageTotal * totalDuration,
            ]}
            onValueChange={onChangeAnimationDuration}
          />
        </BottomSheetModal>
      )}
    </>
  );
};

export default memo(CoverEditorOverlayImageAnimationTool);
const previewDuration = 2;
const AnimationPreview = ({
  animationId,
  height,
  width,
  skImage,
  editionParameters,
  lutShader,
}: {
  animationId: OverlayAnimations;
  height: number;
  width: number;
  duration: number;
  skImage: DerivedValue<SkImage | null> | null;
  editionParameters?: EditionParameters | null;
  lutShader?: SkShader | null;
}) => {
  const animation = overlayAnimations[animationId];

  const startTime = useMemo(() => Date.now(), []);
  const animationStateSharedValue = useSharedValue(0);

  useFrameCallback(() => {
    animationStateSharedValue.value =
      ((Date.now() - startTime) / 1000) % previewDuration;
  });

  const picture = useDerivedValue(() =>
    createPicture(canvas => {
      if (!animation || !skImage?.value) {
        return;
      }

      const shader = transformImage({
        image: skImage.value,
        width,
        height,
        editionParameters,
        lutShader,
        animation: animation
          ? {
              animateMatrix: animation.animateMatrix,
              time: animationStateSharedValue.value,
              end: previewDuration,
              start: 0,
            }
          : null,
      });
      let paint;
      if (animation && animation.animateShader) {
        paint = animation.animateShader({
          shader,
          time: animationStateSharedValue.value,
          start: 0,
          end: previewDuration,
        });
      } else {
        paint = Skia.Paint();
        paint.setShader(shader);
      }

      canvas.save();
      canvas.drawPaint(paint);
      canvas.restore();
    }),
  );

  return (
    <View style={{ height, width }}>
      <Canvas style={{ width, height }}>
        <Picture picture={picture} />
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  boxContainer: { height: 80 / COVER_RATIO + 70 },
});
