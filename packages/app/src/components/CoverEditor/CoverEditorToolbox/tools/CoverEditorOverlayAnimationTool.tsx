import { Canvas, Skia, Image } from '@shopify/react-native-skia';
import { memo, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
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
import { getCoverDuration } from '#components/CoverEditor/coverEditorHelpers';
import TransformedImageRenderer from '#components/TransformedImageRenderer';
import { keyExtractor } from '#helpers/idHelpers';
import {
  createImageFromNativeTexture,
  scaleCropData,
  transformImage,
  useLutTexture,
} from '#helpers/mediaEditions';
import { drawOffScreen, useOffScreenSurface } from '#helpers/skiaHelpers';
import useBoolean from '#hooks/useBoolean';
import BottomSheetModal from '#ui/BottomSheetModal';
import DoubleSlider from '#ui/DoubleSlider';
import Header from '#ui/Header';
import Text from '#ui/Text';
import ToolBoxSection from '../../../Toolbar/ToolBoxSection';
import {
  useCoverEditorContext,
  useCoverEditorEditContext,
  useCoverEditorOverlayLayer,
} from '../../CoverEditorContext';

import type { BoxButtonItemInfo } from '#components/BoxSelectionList';
import type {
  OverlayAnimationListItem,
  OverlayAnimations,
} from '#components/CoverEditor/coverDrawer/overlayAnimations';
import type { EditionParameters } from '#helpers/mediaEditions';
import type { TextureInfo } from '#helpers/mediaEditions/NativeTextureLoader';
import type { SkImage } from '@shopify/react-native-skia';
import type { DerivedValue } from 'react-native-reanimated';

const CoverEditorOverlayImageAnimationTool = () => {
  const coverEditorState = useCoverEditorContext();
  const dispatch = useCoverEditorEditContext();
  const activeOverlay = useCoverEditorOverlayLayer();
  const totalDuration = getCoverDuration(coverEditorState);

  const [show, open, close] = useBoolean(false);

  const animations = useOverlayAnimationList();

  const hasActiveOverlay = activeOverlay !== null;

  const onChangeAnimationDuration = useCallback(
    (value: number[]) => {
      if (hasActiveOverlay) {
        //duration should be at minimum COVER_MIN_MEDIA_DURATION
        const duration = value[1] - value[0];
        let start = value[0];
        let end = value[1];
        if (duration < COVER_MIN_MEDIA_DURATION) {
          start = Math.min(end - MIN_DURATION_ANIMATION, start);
          end = Math.max(start + MIN_DURATION_ANIMATION, end);
        }

        const startPercent = (start / totalDuration) * 100;
        const endPercent = (end / totalDuration) * 100;

        dispatch({
          type: 'UPDATE_OVERLAY_LAYER',
          payload: {
            startPercentageTotal: startPercent,
            endPercentageTotal: endPercent,
          },
        });
      }
    },
    [hasActiveOverlay, dispatch, totalDuration],
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

  const textureInfo = useMemo(() => {
    return activeOverlay ? coverEditorState.images[activeOverlay.id] : null;
  }, [activeOverlay, coverEditorState.images]);

  const imageScale =
    coverEditorState.imagesScales[activeOverlay?.id ?? ''] ?? 1;
  const editionParameters = useMemo(() => {
    return {
      ...activeOverlay?.editionParameters,
      cropData: activeOverlay?.editionParameters?.cropData
        ? scaleCropData(activeOverlay.editionParameters.cropData, imageScale)
        : undefined,
    };
  }, [activeOverlay?.editionParameters, imageScale]);

  const skImage = useDerivedValue(() => {
    if (!textureInfo) {
      return null;
    }
    return createImageFromNativeTexture(textureInfo);
  }, [textureInfo]);

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

  const lutTexture = useLutTexture(activeOverlay?.filter);

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
            editionParameters={editionParameters}
            lutTexture={lutTexture}
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
          editionParameters={editionParameters}
        />
      );
    },
    [activeOverlay, editionParameters, lutTexture, skImage],
  );

  const imageRatio = activeOverlay
    ? (activeOverlay.bounds.width / activeOverlay.bounds.height) * COVER_RATIO
    : 1;

  const limitedImageRatio = Math.min(
    Math.max(imageRatio, SELECTION_MINIMUM_IMAGE_RATIO),
    SELECTION_MAXIMUM_IMAGE_RATIO,
  );

  const selectionHeight = useMemo(() => {
    return (
      SELECTION_MAXIMUM_HEIGHT -
      (limitedImageRatio - SELECTION_MINIMUM_IMAGE_RATIO) *
        SELECTION_IMAGE_STEP_HEIGHT
    );
  }, [limitedImageRatio]);

  const sliderValue = useMemo(
    () => [
      ((activeOverlay?.startPercentageTotal ?? 0) * totalDuration) / 100,
      ((activeOverlay?.endPercentageTotal ?? 100) * totalDuration) / 100,
    ],
    [
      activeOverlay?.startPercentageTotal,
      activeOverlay?.endPercentageTotal,
      totalDuration,
    ],
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
        onPress={open}
      />
      {activeOverlay != null && (
        <BottomSheetModal
          lazy
          onDismiss={close}
          visible={show}
          enableContentPanningGesture={false}
        >
          <Header
            middleElement={
              <Text variant="large">
                <FormattedMessage
                  defaultMessage="Animations "
                  description="CoverEditor Animations Tool - Title"
                />
              </Text>
            }
            rightElement={<DoneHeaderButton onPress={close} />}
          />
          <View style={{ height: selectionHeight }}>
            <BoxSelectionList
              data={animations}
              renderItem={renderItem}
              renderLabel={renderLabel}
              keyExtractor={keyExtractor}
              accessibilityRole="list"
              onSelect={onSelect}
              imageRatio={limitedImageRatio}
              selectedItem={
                animations.find(item => item.id === activeOverlay.animation) ??
                null
              }
              fixedItemWidth={80}
            />
          </View>
          <View style={styles.doubleSliderContainer}>
            <DoubleSlider
              minimumValue={0}
              maximumValue={totalDuration}
              value={sliderValue}
              onValueChange={onChangeAnimationDuration}
            />
          </View>
        </BottomSheetModal>
      )}
    </>
  );
};

export default memo(CoverEditorOverlayImageAnimationTool);

const MIN_DURATION_ANIMATION = 0.5;

const AnimationPreview = ({
  animationId,
  height,
  width,
  skImage,
  editionParameters,
  lutTexture,
}: {
  animationId: OverlayAnimations;
  height: number;
  width: number;
  skImage: DerivedValue<SkImage | null> | null;
  editionParameters?: EditionParameters | null;
  lutTexture?: TextureInfo | null;
}) => {
  const animation = overlayAnimations[animationId];

  const startTime = useMemo(() => Date.now(), []);
  const image = useSharedValue<SkImage | null>(null);
  const surface = useOffScreenSurface(width, height);
  useFrameCallback(() => {
    const sourceImage = skImage?.value;
    if (!sourceImage) {
      image.value = null;
      return;
    }
    image.value = drawOffScreen(surface, (canvas, width, height) => {
      const { animateCanvas, animatePaint, animateImageFilter } = animation(
        ((Date.now() - startTime) % 3000) / 3000,
      );
      const paint = Skia.Paint();
      const imageFilter = transformImage({
        image: sourceImage,
        imageInfo: {
          width: sourceImage.width(),
          height: sourceImage.height(),
          matrix: Skia.Matrix(),
        },
        targetWidth: width,
        targetHeight: height,
        editionParameters,
        lutTexture,
      });
      paint.setImageFilter(
        animateImageFilter ? animateImageFilter(imageFilter) : imageFilter,
      );
      const rect = { x: 0, y: 0, width, height };
      animateCanvas?.(canvas, rect);
      animatePaint?.(paint, rect);
      canvas.drawPaint(paint);
    });
  }, true);

  return (
    <View style={{ height, width }}>
      <Canvas style={{ width, height }} opaque>
        <Image image={image} x={0} y={0} width={width} height={height} />
      </Canvas>
    </View>
  );
};

const SELECTION_MINIMUM_IMAGE_RATIO = 0.5;
const SELECTION_MAXIMUM_IMAGE_RATIO = 2;
const SELECTION_MAXIMUM_HEIGHT = 140;
const SELECTION_IMAGE_STEP_HEIGHT = 26;

const styles = StyleSheet.create({
  doubleSliderContainer: { paddingHorizontal: 20 },
});
