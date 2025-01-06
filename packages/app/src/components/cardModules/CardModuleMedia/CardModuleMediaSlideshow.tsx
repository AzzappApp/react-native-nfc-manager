import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PixelRatio, Platform, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import useBoolean from '#hooks/useBoolean';
import useInterval from '#hooks/useInterval';
import { useIsCardModuleEdition } from '../CardModuleEditionContext';
import CardModuleMediaEditPreview from '../CardModuleMediaEditPreview';
import CardModuleMediaItem from '../CardModuleMediaItem';
import CardModulePressableTool from '../tool/CardModulePressableTool';
import type {
  CardModuleMedia,
  CardModuleVariantType,
} from '../cardModuleEditorType';
import type { ListRenderItemInfo } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type CardModuleMediaSlideshowProps = CardModuleVariantType & {
  cardModuleMedias: CardModuleMedia[];
};

//Simple component to render, not bind to any relay fragment
const CardModuleMediaSlideshow = ({
  cardModuleColor,
  cardModuleMedias,
  cardStyle,
  displayMode,
  dimension,
  canPlay,
  setEditableItemIndex,
}: CardModuleMediaSlideshowProps) => {
  const scrollIndex = useSharedValue(0);
  const paddinHorizontal = displayMode === 'desktop' ? 40 : 0;

  const screenWidth = dimension.width;

  const itemWidth = Math.trunc(
    PixelRatio.roundToNearestPixel(
      (screenWidth * 70) / 100 - 2 * paddinHorizontal,
    ),
  ); //avoid approximation during sliding, getting non integer index

  const offset = useMemo(
    () => (itemWidth - itemWidth * SCALE_RATIO) / 2,
    [itemWidth],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<CardModuleMedia>) => {
      const onPress = setEditableItemIndex
        ? () => setEditableItemIndex(index)
        : undefined;
      return (
        <CardModulePressableTool
          active={!!setEditableItemIndex}
          onPress={onPress}
        >
          <SlideshowItem
            cardModuleMedia={item}
            index={index}
            scrollIndex={scrollIndex}
            offset={offset}
            itemWidth={itemWidth}
            borderRadius={cardStyle?.borderRadius ?? 0}
            gap={cardStyle?.gap}
            canPlay={canPlay}
          />
        </CardModulePressableTool>
      );
    },
    [
      setEditableItemIndex,
      scrollIndex,
      offset,
      itemWidth,
      canPlay,
      cardStyle?.borderRadius,
      cardStyle?.gap,
    ],
  );
  // Duplicate the data multiple times to create a larger dataset
  const listRef = useRef<Animated.FlatList<{ id: string; uri: string }>>(null);

  const handleScrollToOffset = (offset: number, animated = false) => {
    listRef.current?.scrollToOffset({ offset, animated });
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      const index = event.contentOffset.x / itemWidth;
      scrollIndex.value = index;
    },
  });

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: itemWidth,
      offset: itemWidth * index,
      index,
    }),
    [itemWidth],
  );
  const ccstyle = useMemo(() => {
    return [
      {
        paddingLeft: (screenWidth - itemWidth) / 2,
        paddingRight: (screenWidth - itemWidth) / 2,
        height: itemWidth,
      },
    ];
  }, [screenWidth, itemWidth]);

  // Auto-slide play
  const [isAutoPlay, startAutoPlay, stopAutoPlay] = useBoolean(true);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward

  useInterval(() => {
    if (isAutoPlay) {
      let nextIndex = scrollIndex.value + direction;
      if (nextIndex >= cardModuleMedias.length) {
        nextIndex = cardModuleMedias.length - 1;
        setDirection(-1);
      } else if (nextIndex < 0) {
        nextIndex = 0;
        setDirection(1);
      }

      handleScrollToOffset(nextIndex * itemWidth, true);
    }
  }, 1500);

  useEffect(() => {
    handleScrollToOffset(0, false);
  }, [itemWidth]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: itemWidth + 40,
          backgroundColor: cardModuleColor.background,
          pointerEvents: displayMode === 'edit' ? 'none' : 'auto',
        },
      ]}
    >
      <Animated.FlatList
        ref={listRef}
        data={cardModuleMedias}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        decelerationRate="fast"
        snapToAlignment="start"
        snapToInterval={itemWidth}
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        getItemLayout={getItemLayout}
        contentContainerStyle={ccstyle}
        onTouchStart={stopAutoPlay}
        onTouchEnd={startAutoPlay}
        onMomentumScrollEnd={startAutoPlay} //onTouchEnd sometimes is not properly catch
      />
    </Animated.View>
  );
};

const keyExtractor = (item: CardModuleMedia, index: number) =>
  `${item.media.uri}_${index}`;
export default CardModuleMediaSlideshow;

const SCALE_RATIO = 0.4;

type SlideshowItemProps = {
  cardModuleMedia: CardModuleMedia;
  index: number;
  scrollIndex: SharedValue<number>;
  offset: number;
  itemWidth: number;
  gap?: number;
  borderRadius?: number;
  canPlay: boolean;
};

//using memo(SlideshowItem) will require a custom isEqual function as there is media shallow comparison to do on cardModuleMedia
const SlideshowItem = ({
  cardModuleMedia,
  index,
  scrollIndex,
  offset,
  itemWidth,
  gap = 0,
  borderRadius = 0,
  canPlay,
}: SlideshowItemProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    const interpolateScale = interpolate(
      scrollIndex.value,
      [index - 1, index, index + 1],
      [SCALE_RATIO, 1, SCALE_RATIO],
      Extrapolation.CLAMP,
    );

    const translateX = interpolate(
      scrollIndex.value,
      [index - 1, index, index + 1],
      [-offset + gap / 2, 0, offset - gap / 2],
      Extrapolation.EXTEND,
    );

    const opacity =
      media?.kind === 'video' && Platform.OS === 'android' // media may be undefined
        ? 1
        : interpolate(
            scrollIndex.value,
            [index - 1, index, index + 1],
            [0.25, 1, 0.25],
            Extrapolation.CLAMP,
          );

    return {
      opacity,
      transform: [{ translateX }, { scale: interpolateScale }],
      width: itemWidth,
      borderRadius,
    };
  });

  const MediaItemRenderer = useIsCardModuleEdition()
    ? CardModuleMediaEditPreview
    : CardModuleMediaItem;

  const { media } = cardModuleMedia;
  return (
    <Animated.View style={[styles.imageContainer, animatedStyle]}>
      <MediaItemRenderer
        media={media}
        canPlay={canPlay}
        dimension={{ width: itemWidth, height: itemWidth }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    flexGrow: 0,
    flexShrink: 0,
    paddingTop: 20,
  },
  imageContainer: {
    aspectRatio: 1,
    overflow: 'hidden',
  },
});
