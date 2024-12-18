import { Canvas, Image } from '@shopify/react-native-skia';
import { memo, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import { useSharedValue, useFrameCallback } from 'react-native-reanimated';
import {
  COVER_MIN_MEDIA_DURATION,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import BoxSelectionList from '#components/BoxSelectionList';
import { DoneHeaderButton } from '#components/commonsButtons';
import textAnimations, {
  useCoverTextAnimationList,
} from '#components/CoverEditor/coverDrawer/coverTextAnimations';
import { createParagraph } from '#components/CoverEditor/coverDrawer/coverTextDrawer';
import {
  getCoverDuration,
  percentRectToRect,
} from '#components/CoverEditor/coverEditorHelpers';
import { keyExtractor } from '#helpers/idHelpers';
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
  useCoverEditorTextLayer,
} from '../../CoverEditorContext';

import type { BoxButtonItemInfo } from '#components/BoxSelectionList';
import type {
  CoverTextAnimationListItem,
  CoverTextAnimations,
} from '#components/CoverEditor/coverDrawer/coverTextAnimations';
import type { CoverEditorTextLayerItem } from '#components/CoverEditor/coverEditorTypes';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';
import type { SkImage } from '@shopify/react-native-skia';

const CoverEditorTextImageAnimationTool = () => {
  const coverEditorState = useCoverEditorContext();
  const dispatch = useCoverEditorEditContext();
  const activeTextLayer = useCoverEditorTextLayer();
  const coverDuration = getCoverDuration(coverEditorState);
  const { cardColors } = coverEditorState;

  const animations = useCoverTextAnimationList();

  const [show, open, close] = useBoolean(false);

  const hasActiveTextLayer = activeTextLayer !== null;

  const onChangeAnimationDuration = useCallback(
    (value: number[]) => {
      if (hasActiveTextLayer) {
        //duration should be at minimum COVER_MIN_MEDIA_DURATION
        const duration = value[1] - value[0];
        let start = value[0];
        let end = value[1];
        if (duration < COVER_MIN_MEDIA_DURATION) {
          //left slider is moving
          start = Math.min(end - MIN_DURATION_ANIMATION, start);

          end = Math.max(start + MIN_DURATION_ANIMATION, end);
        }

        const startPercent = (start / coverDuration) * 100;
        const endPercent = (end / coverDuration) * 100;

        dispatch({
          type: 'UPDATE_TEXT_LAYER',
          payload: {
            startPercentageTotal: startPercent,
            endPercentageTotal: endPercent,
          },
        });
      }
    },
    [hasActiveTextLayer, dispatch, coverDuration],
  );

  const onSelect = useCallback(
    (anim: CoverTextAnimationListItem | null) => {
      dispatch({
        type: 'UPDATE_TEXT_LAYER',
        payload: { animation: anim?.id ?? null },
      });
    },
    [dispatch],
  );

  const intl = useIntl();
  const renderLabel = useCallback(
    ({ item }: BoxButtonItemInfo<CoverTextAnimationListItem>) =>
      item
        ? item?.label
        : intl.formatMessage({
            defaultMessage: 'None',
            description: 'Cover Edition Animation - None',
          }),
    [intl],
  );

  const renderItem = useCallback(
    ({
      item,
      height,
      width,
    }: BoxButtonItemInfo<CoverTextAnimationListItem | null>) => {
      if (!activeTextLayer) {
        return null;
      }
      return (
        <AnimationPreview
          animationId={item ? item.id : null}
          height={height}
          width={width}
          activeTextLayer={activeTextLayer}
          cardColors={cardColors}
        />
      );
    },
    [activeTextLayer, cardColors],
  );

  const sliderValue = useMemo(
    () => [
      ((activeTextLayer?.startPercentageTotal ?? 0) * coverDuration) / 100,
      ((activeTextLayer?.endPercentageTotal ?? 0) * coverDuration) / 100,
    ],
    [
      activeTextLayer?.startPercentageTotal,
      activeTextLayer?.endPercentageTotal,
      coverDuration,
    ],
  );

  return (
    <>
      <ToolBoxSection
        icon="animate"
        label={intl.formatMessage({
          defaultMessage: 'Animations',
          description:
            'Cover Edition Image Text animation Tool Button - Animations',
        })}
        onPress={open}
      />
      {hasActiveTextLayer && (
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
                  defaultMessage="Animations"
                  description="CoverEditor Animations Tool - Title"
                />
              </Text>
            }
            rightElement={<DoneHeaderButton onPress={close} />}
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
                animations.find(
                  item => item.id === activeTextLayer.animation,
                ) ?? null
              }
            />
          </View>
          <View style={styles.doubleSliderContainer}>
            <DoubleSlider
              minimumValue={0}
              maximumValue={coverDuration}
              value={sliderValue}
              onValueChange={onChangeAnimationDuration}
            />
          </View>
        </BottomSheetModal>
      )}
    </>
  );
};

export default memo(CoverEditorTextImageAnimationTool);

const MIN_DURATION_ANIMATION = 0.5;

const AnimationPreview = ({
  animationId,
  activeTextLayer,
  height,
  width,
  cardColors,
}: {
  animationId: CoverTextAnimations | null;
  height: number;
  width: number;
  activeTextLayer: CoverEditorTextLayerItem;
  cardColors: ColorPalette;
}) => {
  const animation = animationId ? textAnimations[animationId] : null;

  const startTime = useMemo(() => Date.now(), []);
  const image = useSharedValue<SkImage | null>(null);
  const surface = useOffScreenSurface(width, height);
  useFrameCallback(() => {
    image.value = drawOffScreen(surface, (canvas, width, height) => {
      const paragraph = createParagraph({
        layer: activeTextLayer,
        canvasWidth: width,
        cardColors,
      });

      const { rotation, position, width: layerWidth } = activeTextLayer;
      const {
        x,
        y,
        width: textWidth,
      } = percentRectToRect(
        {
          ...position,
          width: layerWidth,
          height: 0,
        },
        width,
        height,
      );

      canvas.translate(x, y);
      if (rotation) {
        canvas.rotate((rotation * 180) / Math.PI, 0, 0);
      }

      if (animation) {
        animation({
          progress: ((Date.now() - startTime) % 3000) / 3000,
          paragraph,
          textLayer: activeTextLayer,
          canvas,
          canvasWidth: width,
          canvasHeight: height,
          cardColors,
        });
      } else {
        paragraph.paint(canvas, -textWidth / 2, -paragraph.getHeight() / 2);
      }
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

const styles = StyleSheet.create({
  boxContainer: { height: 80 / COVER_RATIO + 70 },
  doubleSliderContainer: { paddingHorizontal: 20 },
});
