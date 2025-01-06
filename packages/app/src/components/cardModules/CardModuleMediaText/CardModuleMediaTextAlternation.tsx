import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { getTextStyle, getTitleStyle } from '#helpers/cardModuleHelpers';
import useScreenDimensions from '#hooks/useScreenDimensions';
import Text from '#ui/Text';
import AlternationContainer from '../AlternationContainer';
import CardModulePressableTool from '../tool/CardModulePressableTool';
import type {
  CardModuleDimension,
  CardModuleMedia,
  CardModuleVariantType,
} from '../cardModuleEditorType';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type {
  CardModuleColor,
  DisplayMode,
} from '@azzapp/shared/cardModuleHelpers';
import type { Animated, LayoutChangeEvent } from 'react-native';

type CardModuleMediaTextAlternationProps = CardModuleVariantType & {
  cardModuleMedias: CardModuleMedia[];
  onLayout?: (event: LayoutChangeEvent) => void;
  scrollPosition?: Animated.Value;
  modulePosition?: number;
};

const CardModuleMediaTextAlternation = ({
  cardModuleMedias,
  cardModuleColor,
  dimension: providedDimension,
  onLayout,
  displayMode,
  cardStyle,
  setEditableItemIndex,
  scrollPosition,
  modulePosition,
  canPlay,
  webCardViewMode,
}: CardModuleMediaTextAlternationProps) => {
  const screenDimension = useScreenDimensions();
  const dimension = providedDimension ?? screenDimension;

  if (!scrollPosition) {
    throw new Error(
      'CardModuleMediaTextAlternation : the alternation component require a scrollPosition',
    );
  }

  const items =
    webCardViewMode === 'edit'
      ? cardModuleMedias.slice(0, 1)
      : cardModuleMedias;
  return (
    <View
      onLayout={onLayout}
      style={{ backgroundColor: cardModuleColor.background }}
    >
      {items.map((cardModuleMedia, index) => {
        return (
          <AlternationItem
            key={`${cardModuleMedia.media.id}_${index}`}
            cardModuleMedia={cardModuleMedia}
            cardModuleColor={cardModuleColor}
            dimension={dimension}
            displayMode={displayMode}
            cardStyle={cardStyle}
            setEditableItemIndex={setEditableItemIndex}
            scrollPosition={scrollPosition}
            modulePosition={modulePosition}
            index={index}
            canPlay={canPlay}
          />
        );
      })}
    </View>
  );
};

const AlternationItem = ({
  cardModuleMedia,
  cardModuleColor,
  dimension,
  displayMode,
  cardStyle,
  canPlay,
  setEditableItemIndex,
  scrollPosition,
  modulePosition,
  index,
}: {
  cardModuleMedia: CardModuleMedia;
  cardModuleColor: CardModuleColor;
  dimension: CardModuleDimension;
  displayMode: DisplayMode;
  cardStyle?: CardStyle | null;
  canPlay: boolean;
  setEditableItemIndex?: (index: number) => void;
  scrollPosition: Animated.Value;
  modulePosition?: number;
  index: number;
}) => {
  const [parentY, setParentY] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setParentY(event.nativeEvent.layout.y);
  }, []);

  const onPressItem = useCallback(() => {
    setEditableItemIndex?.(index);
  }, [index, setEditableItemIndex]);

  return (
    <CardModulePressableTool
      active={!!setEditableItemIndex}
      onPress={onPressItem}
      onLayout={onLayout}
    >
      <AlternationContainer
        scrollY={scrollPosition}
        modulePosition={modulePosition}
        displayMode={displayMode}
        dimension={dimension}
        media={cardModuleMedia.media}
        cardStyle={cardStyle}
        index={index}
        parentY={parentY}
        canPlay={canPlay}
      >
        <View style={styles.bottomContainer}>
          <Text
            variant="large"
            style={getTitleStyle(cardStyle, cardModuleColor)}
          >
            {cardModuleMedia.title}
          </Text>
          <Text style={getTextStyle(cardStyle, cardModuleColor)}>
            {cardModuleMedia.text}
          </Text>
        </View>
      </AlternationContainer>
    </CardModulePressableTool>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    justifyContent: 'center',
    flex: 1,
    rowGap: 20,
  },
});

export default CardModuleMediaTextAlternation;
