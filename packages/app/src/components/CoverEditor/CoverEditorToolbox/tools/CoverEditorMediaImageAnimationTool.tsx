import { Canvas, Skia, Image } from '@shopify/react-native-skia';
import { memo, useCallback, useMemo, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet, Alert } from 'react-native';
import {
  useSharedValue,
  useFrameCallback,
  useDerivedValue,
} from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';
import {
  COVER_MAX_MEDIA_DURATION,
  COVER_MIN_MEDIA_DURATION,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import BoxSelectionList from '#components/BoxSelectionList';
import { DoneHeaderButton } from '#components/commonsButtons';
import ToolBoxSection from '#components/Toolbar/ToolBoxSection';
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
import Header from '#ui/Header';
import LabeledWheelSelector from '#ui/LabeledWheelSelector';
import Text from '#ui/Text';
import mediaAnimations, {
  useMediaAnimationList,
} from '../../coverDrawer/mediaAnimations';
import {
  useCoverEditorActiveImageMedia,
  useCoverEditorContext,
  useCoverEditorEditContext,
} from '../../CoverEditorContext';
import type { BoxButtonItemInfo } from '#components/BoxSelectionList';
import type { EditionParameters } from '#helpers/mediaEditions';
import type { TextureInfo } from '#helpers/mediaEditions/NativeTextureLoader';
import type {
  MediaAnimationListItem,
  MediaAnimations,
} from '../../coverDrawer/mediaAnimations';
import type { SkImage } from '@shopify/react-native-skia';
import type { DerivedValue } from 'react-native-reanimated';

const CoverEditorMediaImageAnimationTool = () => {
  const [show, open, close] = useBoolean(false);
  const coverEditorState = useCoverEditorContext();
  const activeMedia = useCoverEditorActiveImageMedia();
  const { medias } = useCoverEditorContext();
  const hasMultipleMedias =
    medias.filter(media => media.kind === 'image').length > 1;
  const dispatch = useCoverEditorEditContext();
  const animations = useMediaAnimationList();
  const hasChanges = useRef(false);
  const onSelect = useCallback(
    (anim: MediaAnimationListItem | null) => {
      dispatch({
        type: 'UPDATE_MEDIA_IMAGE_ANIMATION',
        payload: anim?.id ?? null,
      });
      hasChanges.current = true;
    },
    [dispatch],
  );

  const textureInfo = useMemo(() => {
    return activeMedia ? coverEditorState.images[activeMedia.id] : null;
  }, [activeMedia, coverEditorState.images]);

  const skImage = useDerivedValue(() => {
    if (!textureInfo) {
      return null;
    }
    return createImageFromNativeTexture(textureInfo);
  }, [textureInfo]);

  const imageScale = coverEditorState.imagesScales[activeMedia?.id ?? ''] ?? 1;
  const editionParameters = useMemo(() => {
    return {
      ...activeMedia?.editionParameters,
      cropData: activeMedia?.editionParameters?.cropData
        ? scaleCropData(activeMedia.editionParameters.cropData, imageScale)
        : undefined,
    };
  }, [activeMedia?.editionParameters, imageScale]);

  const onChangeDurationSlider = useDebouncedCallback(
    (duration: number) => {
      //initial value of slider call on change, avoid setting the hasChange bool to true
      if (activeMedia?.duration !== duration) {
        dispatch({
          type: 'UPDATE_MEDIA_IMAGE_DURATION',
          payload: duration,
        });
        hasChanges.current = true;
      }
    },
    500,
    { leading: false },
  );

  const intl = useIntl();
  const renderLabel = useCallback(
    ({ item }: BoxButtonItemInfo<MediaAnimationListItem>) =>
      item
        ? item?.label
        : intl.formatMessage({
            defaultMessage: 'None',
            description: 'Cover Edition Animation - None',
          }),
    [intl],
  );

  const lutTexture = useLutTexture(activeMedia?.filter);

  const renderItem = useCallback(
    ({
      item,
      height,
      width,
    }: BoxButtonItemInfo<MediaAnimationListItem | null>) => {
      if (item && activeMedia && skImage) {
        return (
          <AnimationPreview
            animationId={item.id}
            height={height}
            width={width}
            skImage={skImage}
            editionParameters={editionParameters}
            duration={activeMedia?.duration}
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
          filter={activeMedia?.filter}
          editionParameters={editionParameters}
        />
      );
    },
    [activeMedia, editionParameters, lutTexture, skImage],
  );

  const onFinished = useCallback(() => {
    if (hasMultipleMedias && activeMedia && hasChanges.current) {
      hasChanges.current = false;
      Alert.alert(
        intl.formatMessage({
          defaultMessage: 'Apply to all images ?',
          description:
            'Title of the alert to apply this animation to all images',
        }),
        intl.formatMessage({
          defaultMessage: 'Do you want to apply this animation to all images ?',
          description:
            'Description of the alert to apply a animation to all images',
        }),
        [
          {
            text: intl.formatMessage({
              defaultMessage: 'No',
              description: 'Button to not apply the animation to all images',
            }),
            onPress: close,
          },
          {
            text: intl.formatMessage({
              defaultMessage: 'Yes',
              description: 'Button to apply the filter to all images',
            }),
            onPress: () => {
              dispatch({
                type: 'UPDATE_ALL_IMAGES_MEDIA_ANIMATION',
                payload: {
                  animation: activeMedia.animation,
                  duration: activeMedia.duration,
                },
              });
              close();
            },
            isPreferred: true,
          },
        ],
      );
    } else {
      hasChanges.current = false;
      close();
    }
  }, [activeMedia, dispatch, hasMultipleMedias, intl, close]);

  return (
    <>
      <ToolBoxSection
        icon="animate"
        label={intl.formatMessage({
          defaultMessage: 'Animations',
          description:
            'Cover Edition Image Media animation Tool Button - Animations',
        })}
        onPress={open}
      />
      {activeMedia != null && (
        <BottomSheetModal lazy onDismiss={close} visible={show}>
          <Header
            middleElement={
              <Text variant="large">
                <FormattedMessage
                  defaultMessage="Animations "
                  description="CoverEditor Animations Tool - Title"
                />
              </Text>
            }
            rightElement={<DoneHeaderButton onPress={onFinished} />}
          />
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
                animations.find(item => item.id === activeMedia.animation) ??
                null
              }
            />
          </View>
          <LabeledWheelSelector
            min={COVER_MIN_MEDIA_DURATION}
            max={COVER_MAX_MEDIA_DURATION}
            step={0.1}
            interval={15}
            onChange={onChangeDurationSlider}
            value={activeMedia.duration}
            label={intl.formatMessage({
              defaultMessage: 'Duration: ',
              description: 'Duration label in cover edition animation',
            })}
            style={styles.wheelSelectorStyle}
          />
        </BottomSheetModal>
      )}
    </>
  );
};

export default memo(CoverEditorMediaImageAnimationTool);

const AnimationPreview = ({
  animationId,
  height,
  width,
  duration,
  skImage,
  editionParameters,
  lutTexture,
}: {
  animationId: MediaAnimations;
  height: number;
  width: number;
  duration: number;
  skImage: DerivedValue<SkImage | null> | null;
  editionParameters?: EditionParameters | null;
  lutTexture?: TextureInfo | null;
}) => {
  const imageAnimation = mediaAnimations[animationId];

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
      const progress =
        (((Date.now() - startTime) / 1000) % duration) / duration;
      const imageInfo = imageAnimation(progress)({
        matrix: Skia.Matrix(),
        width: sourceImage.width(),
        height: sourceImage.height(),
      });
      const imageFilter = transformImage({
        image: sourceImage,
        imageInfo,
        targetWidth: width,
        targetHeight: height,
        editionParameters,
        lutTexture,
      });
      const paint = Skia.Paint();
      paint.setImageFilter(imageFilter);
      canvas.drawPaint(paint);
    });
  }, true);

  return (
    <View style={{ height, width }}>
      <Canvas style={{ width, height }}>
        <Image image={image} x={0} y={0} width={width} height={height} />
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  wheelSelectorStyle: { paddingHorizontal: 20 },
  boxContainer: { height: 80 / COVER_RATIO + 70 },
});
