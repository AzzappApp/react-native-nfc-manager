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
import type { LayoutChangeEvent } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type CardModuleMediaParallaxProps = CardModuleVariantType & {
  medias: CardModuleMedia[];
  onLayout?: (event: LayoutChangeEvent) => void;
  disableParallax?: boolean;
  scrollPosition?: SharedValue<number>;
  modulePosition?: SharedValue<number>;
};

const CardModuleMediaParallax = ({
  scrollPosition,
  modulePosition,
  disableParallax,
  onLayout,
  medias,
  dimension: providedDimension,
  setEditableItemIndex,
}: CardModuleMediaParallaxProps & {}) => {
  const screenDimension = useScreenDimensions();
  const dimension = providedDimension ?? screenDimension;
  if (!scrollPosition) {
    throw new Error(
      'CardModuleParallax : the parallax component require a scrollPosition',
    );
  }
  return (
    <View onLayout={onLayout}>
      {medias.map(({ media }, index) => {
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
  disableParallax,
  setEditableItemIndex,
}: {
  media: CardModuleSourceMedia;
  dimension: CardModuleDimension;
  index: number;
  scrollPosition: SharedValue<number>;
  modulePosition?: SharedValue<number>;
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
