/* eslint-disable @typescript-eslint/no-var-requires */
import {
  Canvas,
  FilterMode,
  MipmapMode,
  Picture,
  Skia,
  TileMode,
  createPicture,
  useImage,
} from '@shopify/react-native-skia';
import { memo, useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Image, View } from 'react-native';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import BoxSelectionList from '#components/BoxSelectionList';
import { DoneHeaderButton } from '#components/commonsButtons';
import { keyExtractor } from '#helpers/idHelpers';
import useToggle from '#hooks/useToggle';
import BottomSheetModal from '#ui/BottomSheetModal';
import Text from '#ui/Text';
import coverTransitions, {
  useCoverTransitionsList,
} from '../../coverDrawer/coverTransitions';
import { useCoverEditorContext } from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';
import type { BoxButtonItemInfo } from '#components/BoxSelectionList';
import type {
  CoverTransitions,
  CoverTransitionsListItem,
} from '../../coverDrawer/coverTransitions';
import type { SkShader } from '@shopify/react-native-skia';

const CoverEditorTransitionTool = () => {
  const [show, toggleBottomSheet] = useToggle(false);
  const { coverEditorState } = useCoverEditorContext();

  const { dispatch } = useCoverEditorContext();

  const onSelect = useCallback(
    (transition: CoverTransitionsListItem | null) => {
      dispatch({
        type: 'UPDATE_MEDIA_TRANSITION',
        payload: transition ? transition.id : null,
      });
    },
    [dispatch],
  );

  const transitions = useCoverTransitionsList();

  const intl = useIntl();
  const renderLabel = useCallback(
    ({ item }: BoxButtonItemInfo<CoverTransitionsListItem>) =>
      item
        ? item?.label
        : intl.formatMessage({
            defaultMessage: 'None',
            description: 'Cover Edition Transition - None',
          }),
    [intl],
  );

  const previewInImage = useImage(require('./assets/preview_2.png'));

  const previewOutImage = useImage(require('./assets/preview_1.png'));

  const [{ previewIn, previewOut }, setShaders] = useState<{
    previewIn: SkShader | null;
    previewOut: SkShader | null;
  }>({
    previewIn: null,
    previewOut: null,
  });

  const onItemHeightChange = useCallback(
    (height: number) => {
      if (!previewInImage || !previewOutImage) {
        return;
      }
      // 38 for label height very rough estimate
      const scale = (height - 38) / previewInImage.height();
      setShaders({
        previewIn: previewInImage.makeShaderOptions(
          TileMode.Clamp,
          TileMode.Clamp,
          FilterMode.Linear,
          MipmapMode.None,
          Skia.Matrix().scale(scale, scale),
        ),
        previewOut: previewOutImage.makeShaderOptions(
          TileMode.Clamp,
          TileMode.Clamp,
          FilterMode.Linear,
          MipmapMode.None,
          Skia.Matrix().scale(scale, scale),
        ),
      });
    },
    [previewInImage, previewOutImage],
  );

  const renderItem = useCallback(
    ({
      item,
      height,
      width,
    }: BoxButtonItemInfo<CoverTransitionsListItem | null>) => {
      if (!item) {
        return (
          <Image
            source={require('./assets/preview_2.png')}
            style={{ height, width, backgroundColor: colors.grey400 }}
          />
        );
      }
      return (
        <TransitionPreview
          transitionId={item.id}
          height={height}
          width={width}
          previewIn={previewIn}
          previewOut={previewOut}
        />
      );
    },
    [previewIn, previewOut],
  );

  return (
    <>
      <ToolBoxSection
        icon="transition"
        label={intl.formatMessage({
          defaultMessage: 'Transitions',
          description: 'Cover Edition Transition Tool Button - Transitions',
        })}
        onPress={toggleBottomSheet}
      />
      <BottomSheetModal
        lazy
        onRequestClose={toggleBottomSheet}
        visible={show}
        height={276}
        headerTitle={
          <Text variant="large">
            <FormattedMessage
              defaultMessage="Transitions"
              description="CoverEditor Transitions Tool - Title"
            />
          </Text>
        }
        headerRightButton={<DoneHeaderButton onPress={toggleBottomSheet} />}
        contentContainerStyle={{ paddingHorizontal: 0 }}
        headerStyle={{ paddingHorizontal: 20 }}
      >
        <BoxSelectionList
          data={transitions}
          renderItem={renderItem}
          renderLabel={renderLabel}
          keyExtractor={keyExtractor}
          accessibilityRole="list"
          onSelect={onSelect}
          imageRatio={COVER_RATIO}
          onItemHeightChange={onItemHeightChange}
          selectedItem={
            transitions.find(
              item => item.id === coverEditorState.coverTransition,
            ) ?? null
          }
        />
      </BottomSheetModal>
    </>
  );
};

export default memo(CoverEditorTransitionTool);

const PAUSE_TIME = 1;
const ANIMATION_TIME_SCALE = 2;

const TransitionPreview = ({
  transitionId,
  height,
  width,
  previewIn,
  previewOut,
}: {
  transitionId: CoverTransitions;
  height: number;
  width: number;
  previewIn: SkShader | null;
  previewOut: SkShader | null;
}) => {
  const { duration, transition } = coverTransitions[transitionId];

  const startTime = useMemo(() => Date.now(), []);
  const animationStateSharedValue = useSharedValue({
    animationTime: 0,
    reversed: false,
    isPaused: false,
  });
  const scaledAnimationDuration = duration * ANIMATION_TIME_SCALE;
  const totalDuration = scaledAnimationDuration + PAUSE_TIME;
  useFrameCallback(() => {
    let { animationTime, isPaused, reversed } = animationStateSharedValue.value;
    const newTimeValue = ((Date.now() - startTime) / 1000) % totalDuration;
    if (newTimeValue > scaledAnimationDuration) {
      animationTime = 0;
      if (!isPaused) {
        isPaused = true;
        reversed = !reversed;
      }
    } else {
      animationTime = newTimeValue;
      if (isPaused) {
        isPaused = false;
      }
    }
    animationStateSharedValue.value = { animationTime, isPaused, reversed };
  });

  const picture = useDerivedValue(() =>
    createPicture(canvas => {
      if (!previewIn || !previewOut) {
        return;
      }
      const { animationTime, reversed } = animationStateSharedValue.value;

      transition({
        canvas,
        time: animationTime / ANIMATION_TIME_SCALE,
        inShader: reversed ? previewIn : previewOut,
        outShader: reversed ? previewOut : previewIn,
        width,
        height,
      });
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
