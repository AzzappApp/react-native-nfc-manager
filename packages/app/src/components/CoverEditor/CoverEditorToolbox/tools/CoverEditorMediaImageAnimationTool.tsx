import {
  createPicture,
  Canvas,
  Picture,
  Skia,
} from '@shopify/react-native-skia';
import { memo, useCallback, useMemo, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet, Alert } from 'react-native';
import {
  useSharedValue,
  useFrameCallback,
  useDerivedValue,
} from 'react-native-reanimated';
import {
  COVER_MAX_MEDIA_DURATION,
  COVER_MIN_MEDIA_DURATION,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import BoxSelectionList from '#components/BoxSelectionList';
import { DoneHeaderButton } from '#components/commonsButtons';
import { mediaInfoIsImage } from '#components/CoverEditor/coverEditorHelpers';
import TransformedImageRenderer from '#components/TransformedImageRenderer';
import { keyExtractor } from '#helpers/idHelpers';
import {
  transformImage,
  useLutShader,
  useSkImage,
} from '#helpers/mediaEditions';
import useToggle from '#hooks/useToggle';
import BottomSheetModal from '#ui/BottomSheetModal';
import LabeledWheelSelector from '#ui/LabeledWheelSelector';
import Text from '#ui/Text';
import mediaAnimations, {
  useAnimationList,
} from '../../coverDrawer/mediaAnimation';
import {
  useCoverEditorActiveImageMedia,
  useCoverEditorContext,
} from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';

import type { BoxButtonItemInfo } from '#components/BoxSelectionList';
import type { EditionParameters } from '#helpers/mediaEditions';
import type {
  MediaAnimationListItem,
  MediaAnimations,
} from '../../coverDrawer/mediaAnimation';
import type { SkImage, SkShader } from '@shopify/react-native-skia';

const CoverEditorMediaImageAnimationTool = () => {
  const [show, toggleBottomSheet] = useToggle(false);
  const activeMedia = useCoverEditorActiveImageMedia();
  const hasMultipleMedias =
    useCoverEditorContext().coverEditorState.medias.filter(media =>
      mediaInfoIsImage(media),
    ).length > 1;
  const { dispatch } = useCoverEditorContext();
  const animations = useAnimationList();
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

  const skImage = useSkImage({
    uri: activeMedia?.media?.uri,
    kind: activeMedia?.media?.kind,
  });

  const onChangeDurationSlider = useCallback(
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
    [activeMedia?.duration, dispatch],
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

  const lutShader = useLutShader(activeMedia?.filter);

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
            editionParameters={activeMedia?.editionParameters}
            duration={activeMedia?.duration}
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
          filter={activeMedia?.filter}
          editionParameters={activeMedia?.editionParameters}
        />
      );
    },
    [activeMedia, lutShader, skImage],
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
            onPress: toggleBottomSheet,
          },
          {
            text: intl.formatMessage({
              defaultMessage: 'Yes',
              description: 'Button to apply the filter to all images',
            }),
            onPress: () => {
              if (activeMedia && hasChanges.current) {
                dispatch({
                  type: 'UPDATE_ALL_IMAGES_MEDIA_ANIMATION',
                  payload: {
                    animation: activeMedia.animation,
                    duration: activeMedia.duration,
                  },
                });
              }
              toggleBottomSheet();
            },
            isPreferred: true,
          },
        ],
      );
    } else {
      hasChanges.current = false;
      toggleBottomSheet();
    }
  }, [activeMedia, dispatch, hasMultipleMedias, intl, toggleBottomSheet]);

  return (
    <>
      <ToolBoxSection
        icon="animate"
        label={intl.formatMessage({
          defaultMessage: 'Animations',
          description:
            'Cover Edition Image Media animation Tool Button - Animations',
        })}
        onPress={toggleBottomSheet}
      />
      {activeMedia != null && (
        <BottomSheetModal
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
          headerRightButton={<DoneHeaderButton onPress={onFinished} />}
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
  lutShader,
}: {
  animationId: MediaAnimations;
  height: number;
  width: number;
  duration: number;
  skImage: SkImage | null;
  editionParameters?: EditionParameters | null;
  lutShader?: SkShader | null;
}) => {
  const imageAnimation = mediaAnimations[animationId];

  const startTime = useMemo(() => Date.now(), []);
  const animationStateSharedValue = useSharedValue(0);

  useFrameCallback(() => {
    animationStateSharedValue.value =
      ((Date.now() - startTime) / 1000) % duration;
  });

  const picture = useDerivedValue(() =>
    createPicture(canvas => {
      if (!imageAnimation || !skImage) {
        return;
      }

      const shader = transformImage({
        image: skImage,
        width,
        height,
        editionParameters,
        lutShader,
        imageAnimation: {
          animation: imageAnimation,
          time: animationStateSharedValue.value,
          duration,
        },
      });
      const paint = Skia.Paint();
      paint.setShader(shader);
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
