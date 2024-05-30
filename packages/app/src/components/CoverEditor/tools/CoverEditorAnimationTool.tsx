import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { FlatList, Pressable, View } from 'react-native';
import { colors, shadow } from '#theme';
import { DoneHeaderButton } from '#components/commonsButtons';
import {
  MEDIA_ANIMATIONS,
  useAnimationLabel,
} from '#components/CoverRenderer/MediaAnimator';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import useScreenInsets from '#hooks/useScreenInsets';
import useToggle from '#hooks/useToggle';
import BottomSheetModal from '#ui/BottomSheetModal';
import DoubleSlider from '#ui/DoubleSlider';
import Text from '#ui/Text';
import ToolBoxSection from '#ui/ToolBoxSection';
import {
  useCoverEditorContext,
  useCoverEditorOverlayLayer,
} from '../CoverEditorContext';
import type { ListRenderItemInfo } from 'react-native';

const CoverEditorAnimationTool = () => {
  const { bottom } = useScreenInsets();
  const [show, toggleBottomSheet] = useToggle(false);
  const layer = useCoverEditorOverlayLayer(); //use directly the layer for now, only one animated
  const { dispatch } = useCoverEditorContext();

  const save = () => {
    toggleBottomSheet();
  };

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
    ({ item }: ListRenderItemInfo<string>) => {
      return (
        <AnimationOverlay
          animation={item}
          uri={layer!.uri}
          filter={layer!.filter}
          size={0} //  animationSharedValue={animationSharedValue}
          selected={layer?.animation?.id === item}
          select={onSelect}
        />
      );
    },
    [layer, onSelect],
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

  const flatListRef = useRef<FlatList>(null);
  useEffect(() => {
    if (flatListRef.current != null) {
      //TODO: get the index of the selected animation (not sure we really need it)
      // flatListRef.current?.scrollToIndex({
      //   index: 0,
      //   animated: false,
      // });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatListRef?.current]);
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
          height={bottom + 284}
          headerTitle={
            <Text variant="large">
              <FormattedMessage
                defaultMessage="Animations (TODO define them with skia)"
                description="CoverEditor Animations Tool - Title"
              />
            </Text>
          }
          headerRightButton={<DoneHeaderButton onPress={save} />}
        >
          <View style={{ rowGap: 10, overflow: 'visible', marginTop: 25 }}>
            <FlatList
              ref={flatListRef}
              data={['none', ...MEDIA_ANIMATIONS]}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              getItemLayout={getItemLayout}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ overflow: 'visible' }}
            />
          </View>
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

const ITEM_WIDTH = 80;
const BORDER_SELECTED = 5;

const getItemLayout = (_: any, index: number) => ({
  length: ITEM_WIDTH,
  offset: ITEM_WIDTH * index,
  index,
});

const keyExtractor = (item: string) => item;

export default memo(CoverEditorAnimationTool);

type AnimationSampleProps = {
  /**
   * Source Media to Override the Source Media of the template
   */
  uri: string;

  filter: string | null;

  animation: string;
  size: number;
  selected: boolean;
  select: (animation: string) => void;
  // animationSharedValue: SharedValue<number>;
};

const InnerItem = ({
  uri,
  animation,
  selected,
  select,
}: AnimationSampleProps) => {
  //did not want to make inline style with conditional border color - so use variant
  const styles = useVariantStyleSheet(
    styleSheet,
    selected ? 'selected' : 'unselected',
  );
  const label = useAnimationLabel(animation);

  const onPress = useCallback(() => {
    select(animation);
  }, [animation, select]);

  return (
    <Pressable style={styles.itemContainer} onPress={onPress}>
      <View style={styles.itemPreview}>
        {/* TODO: use animation when we will have them defined, so maybe create  a canvas SKIA here */}
        <Image
          style={{ width: ITEM_WIDTH, aspectRatio: 1, borderRadius: 7 }}
          source={{ uri }}
        />
      </View>
      <Text
        variant="small"
        numberOfLines={1}
        adjustsFontSizeToFit
        ellipsizeMode="tail"
      >
        {label}
      </Text>
    </Pressable>
  );

  // return (
  //   <MediaAnimator
  //     animationSharedValue={animationSharedValue}
  //     animation={animation}
  //     width={height}
  //     height={height}
  //     style={{ height, aspectRatio: 1 }}
  //   >
  //     <GPUImageView
  //       style={[{ height, aspectRatio: 1 }]}
  //       layers={[
  //         {
  //           kind: 'image',
  //           uri,
  //           time,
  //           parameters: editionParameters,
  //           lutFilterUri: getFilterUri(filter),
  //         },
  //       ]}
  //     />
  //   </MediaAnimator>
  // );
};
const AnimationOverlay = memo(InnerItem);

const styleSheet = createVariantsStyleSheet(appearance => ({
  default: {
    itemContainer: {
      width: ITEM_WIDTH + 2 * BORDER_SELECTED,
      marginHorizontal: 10 - BORDER_SELECTED,
      height: 105 + 2 * BORDER_SELECTED,
      justifyContent: 'center',
      alignItems: 'center',
      rowGap: 10,
    },
    itemPreview: {
      width: ITEM_WIDTH,
      aspectRatio: 1,
      backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey900,
      borderRadius: 12,
      borderColor: 'transparent',
      borderWidth: 0,
      overflow: 'hidden',
      ...shadow(appearance, 'bottom'),
    },
  },
  selected: {
    itemPreview: {
      borderWidth: BORDER_SELECTED,
      borderColor: appearance === 'light' ? colors.black : colors.white,
    },
  },
  //need a default second step,
  unselected: {},
}));
