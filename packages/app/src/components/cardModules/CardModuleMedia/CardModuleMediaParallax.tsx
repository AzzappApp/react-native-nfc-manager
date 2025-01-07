import { useCallback } from 'react';
import { View } from 'react-native';
import { isModuleAnimationDisabled } from '@azzapp/shared/cardModuleHelpers';
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
  scrollPosition?: RNAnimated.Value;
  modulePosition?: number;
};

const CardModuleMediaParallax = ({
  scrollPosition,
  modulePosition,
  onLayout,
  cardModuleMedias,
  canPlay,
  dimension: providedDimension,
  setEditableItemIndex,
  webCardViewMode,
  displayMode,
}: CardModuleMediaParallaxProps & {}) => {
  const screenDimension = useScreenDimensions();
  const dimension = providedDimension ?? screenDimension;
  if (!scrollPosition) {
    throw new Error(
      'CardModuleMediaParallax : the parallax component require a scrollPosition',
    );
  }
  const items =
     webCardViewMode === 'edit'
      ? cardModuleMedias.slice(0, 1)
      : cardModuleMedias;

  return (
    <View onLayout={onLayout}>
      {items.map(({ media }, index) => {
        return (
          <ParallaxItem
            key={`${media.id}_${index}`}
            media={media}
            dimension={dimension}
            index={index}
            canPlay={canPlay}
            setEditableItemIndex={setEditableItemIndex}
            scrollPosition={scrollPosition}
            modulePosition={modulePosition}
            disableParallax={isModuleAnimationDisabled(
              displayMode,
              webCardViewMode,
            )}
          />
        );
      })}
    </View>
  );
};

const ParallaxItem = ({
  media,
  dimension,
  index,
  scrollPosition,
  modulePosition,
  canPlay,
  setEditableItemIndex,
  disableParallax,
}: {
  media: CardModuleSourceMedia;
  dimension: CardModuleDimension;
  index: number;
  scrollPosition: RNAnimated.Value;
  modulePosition?: number;
  canPlay: boolean;
  setEditableItemIndex?: (index: number) => void;
  disableParallax: boolean;
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
        canPlay={canPlay}
      />
    </CardModulePressableTool>
  );
};

export default CardModuleMediaParallax;
