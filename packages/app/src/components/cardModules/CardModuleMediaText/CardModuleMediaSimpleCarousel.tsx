import { memo, useCallback, useRef, useState } from 'react';
import { FlatList, View, Animated as AnimatedNative } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { RichText } from '#components/ui/RichText';
import { getTextStyle, getTitleStyle } from '#helpers/cardModuleHelpers';
import useIsModuleItemInViewPort from '#hooks/useIsModuleItemInViewPort';
import useScreenDimensions from '#hooks/useScreenDimensions';
import Text from '#ui/Text';
import CardModuleMediaSelector from '../CardModuleMediaSelector';
import CardModulePressableTool from '../tool/CardModulePressableTool';
import type {
  CardModuleMedia,
  CardModuleVariantType,
} from '../cardModuleEditorType';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type {
  CardModuleColor,
  WebCardViewMode,
} from '@azzapp/shared/cardModuleHelpers';
import type { LayoutChangeEvent, NativeScrollEvent } from 'react-native';

type CardModuleMediaSimpleCarouselProps = CardModuleVariantType & {
  cardModuleMedias: CardModuleMedia[];
  onLayout?: (event: LayoutChangeEvent) => void;
  modulePosition?: number;
  scrollPosition?: AnimatedNative.Value;
};

const CardModuleMediaSimpleCarousel = ({
  cardModuleMedias,
  cardModuleColor,
  dimension: providedDimension,
  onLayout,
  cardStyle,
  setEditableItemIndex,
  canPlay,
  webCardViewMode,
  scrollPosition,
  modulePosition,
  moduleEditing,
}: CardModuleMediaSimpleCarouselProps) => {
  if (!scrollPosition) {
    throw new Error(
      'CardModuleMediaSimpleCarousel : the alternation component require a scrollPosition',
    );
  }
  const screenDimension = useScreenDimensions();
  const dimension = providedDimension ?? screenDimension;

  const [componentHeight, setComponentHeight] = useState(0);

  const onLayoutInner = (event: LayoutChangeEvent) => {
    setComponentHeight(event.nativeEvent.layout.height);
    onLayout?.(event);
  };

  const cardGap = Math.max(10, cardStyle?.gap || 0);
  const startPadding = 20;

  const nativeGesture = Gesture.Native();
  const itemWidth = Math.min((dimension.width * 70) / 100, 400);

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new AnimatedNative.Value(0)).current;

  const handleScroll = AnimatedNative.event<NativeScrollEvent>(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: event => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / itemWidth); // Calculate index
        setCurrentIndex(index);
      },
    },
  );

  const lineLength =
    itemWidth * cardModuleMedias.length +
    cardGap * (cardModuleMedias.length - 1) +
    2 * startPadding;

  const isSlidable = lineLength > dimension.width;

  const horizontalPadding = isSlidable
    ? startPadding
    : (dimension.width - lineLength) / 2 + startPadding;

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: itemWidth,
      offset: itemWidth * index + cardGap * (index - 1) + horizontalPadding,
      index,
    }),
    [cardGap, horizontalPadding, itemWidth],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: CardModuleMedia; index: number }) => {
      const onPress = setEditableItemIndex
        ? () => setEditableItemIndex(index)
        : undefined;
      return (
        <CardModulePressableTool
          active={!!setEditableItemIndex}
          onPress={onPress}
        >
          <SimpleCarouselItem
            key={`${item.media.id}_${index}`}
            cardModuleMedia={item}
            cardModuleColor={cardModuleColor}
            mediaWidth={itemWidth}
            cardStyle={cardStyle}
            setEditableItemIndex={setEditableItemIndex}
            index={index}
            canPlay={canPlay && (moduleEditing || currentIndex === index)}
            paused={currentIndex !== index}
            scrollY={scrollPosition}
            modulePosition={modulePosition}
            dimension={dimension}
            webCardViewMode={webCardViewMode}
            componentHeight={componentHeight}
          />
        </CardModulePressableTool>
      );
    },
    [
      setEditableItemIndex,
      cardModuleColor,
      itemWidth,
      cardStyle,
      canPlay,
      moduleEditing,
      currentIndex,
      scrollPosition,
      modulePosition,
      dimension,
      webCardViewMode,
      componentHeight,
    ],
  );
  const { height: screenHeight } = useScreenDimensions();

  return (
    <View
      onLayout={onLayoutInner}
      style={[
        {
          backgroundColor: cardModuleColor.background,
          pointerEvents: webCardViewMode === 'edit' ? 'none' : 'auto',
          paddingTop: cardGap,
          paddingBottom: Math.max(cardGap, 20),
        },
        webCardViewMode === 'edit' && {
          maxHeight: screenHeight,
          overflow: 'hidden',
        },
      ]}
    >
      <GestureDetector gesture={nativeGesture}>
        {isSlidable ? (
          <FlatList
            data={cardModuleMedias}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            horizontal
            decelerationRate="fast"
            snapToAlignment="center"
            snapToInterval={itemWidth + cardGap}
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            disableIntervalMomentum
            getItemLayout={getItemLayout}
            contentInsetAdjustmentBehavior="always"
            contentOffset={{ x: -horizontalPadding, y: 0 }}
            contentInset={{
              right: horizontalPadding,
              left: horizontalPadding,
            }}
            ItemSeparatorComponent={() => {
              return <View style={{ width: cardGap, height: '100%' }} />;
            }}
          />
        ) : (
          <View
            style={{
              flexDirection: 'row',
              paddingStart: horizontalPadding,
              alignItems: 'center',
            }}
          >
            {cardModuleMedias.map((card, index) => {
              return (
                <View key={keyExtractor(card, index)}>
                  {renderItem({ item: card, index })}
                  {index !== cardModuleMedias.length - 1 ? (
                    <View style={{ width: cardGap }} />
                  ) : undefined}
                </View>
              );
            })}
          </View>
        )}
      </GestureDetector>
    </View>
  );
};

const keyExtractor = (item: CardModuleMedia, index: number) =>
  `${item.media.uri}_${index}`;

type SimpleCarouselItemProps = {
  cardModuleMedia: CardModuleMedia;
  cardModuleColor: CardModuleColor;
  cardStyle?: CardStyle | null;
  setEditableItemIndex?: (index: number) => void;
  index: number;
  canPlay: boolean;
  paused: boolean;
  mediaWidth: number;
  scrollY: AnimatedNative.Value;
  modulePosition?: number;
  dimension: {
    width: number;
    height: number;
  };
  webCardViewMode?: WebCardViewMode;
  componentHeight: number;
};

const SimpleCarouselItemComponent = ({
  cardModuleMedia,
  cardModuleColor,
  mediaWidth,
  cardStyle,
  setEditableItemIndex,
  index,
  canPlay,
  scrollY,
  modulePosition,
  paused,
  webCardViewMode,
  dimension,
}: SimpleCarouselItemProps) => {
  const onPressItem = useCallback(() => {
    setEditableItemIndex?.(index);
  }, [index, setEditableItemIndex]);

  const mediaHeight =
    (cardModuleMedia.media.height * mediaWidth) / cardModuleMedia.media.width;

  const inViewport = useIsModuleItemInViewPort(
    scrollY,
    modulePosition ?? 0,
    mediaHeight,
    true,
    webCardViewMode === 'edit',
    dimension,
  );

  return (
    <CardModulePressableTool
      active={!!setEditableItemIndex}
      onPress={onPressItem}
    >
      <View
        style={{
          width: mediaWidth,
          gap: cardStyle?.gap,
        }}
      >
        <CardModuleMediaSelector
          media={cardModuleMedia.media}
          dimension={{
            width: mediaWidth,
            height: mediaHeight,
          }}
          imageStyle={{
            borderRadius: cardStyle?.borderRadius ?? 0,
          }}
          canPlay={canPlay && inViewport}
          priority={inViewport ? 'high' : 'normal'}
          paused={paused}
        />
        <Text variant="large" style={getTitleStyle(cardStyle, cardModuleColor)}>
          {cardModuleMedia.title}
        </Text>
        <RichText
          text={cardModuleMedia.text}
          style={getTextStyle(cardStyle, cardModuleColor)}
        />
      </View>
    </CardModulePressableTool>
  );
};
//item in list should be PureComponent
const SimpleCarouselItem = memo(SimpleCarouselItemComponent);

export default CardModuleMediaSimpleCarousel;
