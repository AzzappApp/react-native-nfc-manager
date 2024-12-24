import { useCallback } from 'react';
import { View } from 'react-native';
import useScreenDimensions from '#hooks/useScreenDimensions';
import ParallaxContainer from '../ParallaxContainer';
import CardModulePressableTool from '../tool/CardModulePressableTool';
import type {
  CardModuleDimension,
  CardModuleMedia,
  CardModuleSourceMedia,
  CardModuleVariantType,
} from '../cardModuleEditorType';
import type { LayoutChangeEvent, Animated as RNAnimated } from 'react-native';

type CardModuleMediaParallaxProps = CardModuleVariantType & {
  cardModuleMedias: CardModuleMedia[];
  onLayout?: (event: LayoutChangeEvent) => void;
  disableParallax?: boolean;
  scrollPosition?: RNAnimated.Value;
  modulePosition?: number;
};

const CardModuleMediaParallax = ({
  scrollPosition,
  modulePosition,
  disableParallax,
  onLayout,
  cardModuleMedias,
  dimension: providedDimension,
  setEditableItemIndex,
  webCardEditing,
}: CardModuleMediaParallaxProps & {}) => {
  const screenDimension = useScreenDimensions();
  const dimension = providedDimension ?? screenDimension;
  if (!scrollPosition) {
    throw new Error(
      'CardModuleMediaParallax : the parallax component require a scrollPosition',
    );
  }
  return (
    <View onLayout={onLayout}>
      {webCardEditing && cardModuleMedias.length > 0 ? (
        <ParallaxItem
          key={`${cardModuleMedias[0].media.id}_${0}`}
          media={cardModuleMedias[0].media}
          dimension={dimension}
          index={0}
          disableParallax={disableParallax}
          setEditableItemIndex={setEditableItemIndex}
          scrollPosition={scrollPosition}
          modulePosition={modulePosition}
        />
      ) : (
        cardModuleMedias.map(({ media }, index) => {
          return (
            <ParallaxItem
              key={`${media.id}_${index}`}
              media={media}
              dimension={dimension}
              index={index}
              disableParallax={disableParallax}
              setEditableItemIndex={setEditableItemIndex}
              scrollPosition={scrollPosition}
              modulePosition={modulePosition}
            />
          );
        })
      )}
    </View>
  );
};

const ParallaxItem = ({
  media,
  dimension,
  index,
  scrollPosition,
  modulePosition,
  disableParallax,
  setEditableItemIndex,
}: {
  media: CardModuleSourceMedia;
  dimension: CardModuleDimension;
  index: number;
  scrollPosition: RNAnimated.Value;
  modulePosition?: number;
  disableParallax?: boolean;
  setEditableItemIndex?: (index: number) => void;
}) => {
  const onPress = useCallback(() => {
    setEditableItemIndex?.(index);
  }, [index, setEditableItemIndex]);

  return (
    <CardModulePressableTool active={!!setEditableItemIndex} onPress={onPress}>
      <ParallaxContainer
        media={media}
        dimension={dimension}
        index={index}
        scrollY={scrollPosition}
        modulePosition={modulePosition}
        disableParallax={disableParallax}
      />
    </CardModulePressableTool>
  );
};

export default CardModuleMediaParallax;
