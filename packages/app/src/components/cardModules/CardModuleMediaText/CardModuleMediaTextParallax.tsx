import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  isModuleAnimationDisabled,
  type CardModuleColor,
  type DisplayMode,
} from '@azzapp/shared/cardModuleHelpers';
import { getTextStyle, getTitleStyle } from '#helpers/cardModuleHelpers';
import useScreenDimensions from '#hooks/useScreenDimensions';
import Text from '#ui/Text';
import ParallaxContainer from '../ParallaxContainer';
import CardModulePressableTool from '../tool/CardModulePressableTool';
import type {
  CardModuleDimension,
  CardModuleMedia,
  CardModuleVariantType,
} from '../cardModuleEditorType';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type { Animated, LayoutChangeEvent } from 'react-native';

type CardModuleMediaTextParallaxProps = CardModuleVariantType & {
  cardModuleMedias: CardModuleMedia[];
  onLayout?: (event: LayoutChangeEvent) => void;
  scrollPosition?: Animated.Value;
  modulePosition?: number;
};

const CardModuleMediaTextParallax = ({
  displayMode,
  cardModuleMedias,
  cardModuleColor,
  dimension: providedDimension,
  scrollPosition,
  modulePosition,
  onLayout,
  cardStyle,
  canPlay,
  setEditableItemIndex,
  webCardViewMode,
}: CardModuleMediaTextParallaxProps) => {
  const screenDimension = useScreenDimensions();
  const dimension = providedDimension ?? screenDimension;

  if (!scrollPosition) {
    throw new Error(
      'CardModuleMediaTextParallax : the parallax component require a scrollPosition',
    );
  }
  // the background color is set with an opacity of 0.8 have to be applied
  // on both view and container. if not on view in webcard preview

  const items =
    webCardViewMode === 'edit'
      ? cardModuleMedias.slice(0, 1)
      : cardModuleMedias;
  return (
    <View onLayout={onLayout}>
      {items.map((cardModuleMedia, index) => {
        return (
          <ParallaxItem
            key={`${cardModuleMedia.media.id}_${index}`}
            cardModuleMedia={cardModuleMedia}
            cardModuleColor={cardModuleColor}
            cardStyle={cardStyle}
            dimension={dimension}
            index={index}
            setEditableItemIndex={setEditableItemIndex}
            scrollPosition={scrollPosition}
            modulePosition={modulePosition}
            displayMode={displayMode}
            disableParallax={isModuleAnimationDisabled(
              displayMode,
              webCardViewMode,
            )}
            canPlay={canPlay}
          />
        );
      })}
    </View>
  );
};

const ParallaxItem = ({
  cardModuleMedia,
  cardModuleColor,
  cardStyle,
  dimension,
  index,
  setEditableItemIndex,
  scrollPosition,
  modulePosition,
  canPlay,
  disableParallax,
  displayMode,
}: {
  cardModuleMedia: CardModuleMedia;
  cardModuleColor: CardModuleColor;
  cardStyle?: CardStyle | null;
  dimension: CardModuleDimension;
  index: number;
  setEditableItemIndex?: (index: number) => void;
  scrollPosition: Animated.Value;
  modulePosition?: number;
  canPlay: boolean;
  disableParallax?: boolean;
  displayMode: DisplayMode;
}) => {
  const onPress = useCallback(() => {
    setEditableItemIndex?.(index);
  }, [index, setEditableItemIndex]);

  return (
    <CardModulePressableTool active={!!setEditableItemIndex} onPress={onPress}>
      <ParallaxContainer
        scrollY={scrollPosition}
        modulePosition={modulePosition}
        dimension={dimension}
        media={cardModuleMedia.media}
        index={index}
        canPlay={canPlay}
        disableParallax={disableParallax}
        imageStyle={styles.opacityImage}
        imageContainerStyle={{ backgroundColor: cardModuleColor.background }}
      >
        <View style={styles.textContainer}>
          <Text
            variant="large"
            style={[
              getTitleStyle(cardStyle, cardModuleColor),
              styles.textStyle,
              displayMode === 'desktop' && { maxWidth: 400 },
            ]}
          >
            {cardModuleMedia.title}
          </Text>
          <Text
            style={[getTextStyle(cardStyle, cardModuleColor), styles.textStyle]}
          >
            {cardModuleMedia.text}
          </Text>
        </View>
      </ParallaxContainer>
    </CardModulePressableTool>
  );
};

const styles = StyleSheet.create({
  opacityImage: { opacity: 0.8 },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    rowGap: 20,
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  textStyle: {
    textAlign: 'center',
  },
});

export default CardModuleMediaTextParallax;
