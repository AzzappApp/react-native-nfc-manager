import { View } from 'react-native';
import useScreenDimensions from '#hooks/useScreenDimensions';
import ParallaxContainer from '../ParallaxContainer';
import CardModulePressableTool from '../tool/CardModulePressableTool';
import type {
  CardModuleMedia,
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
          <CardModulePressableTool
            onPress={setEditableItemIndex}
            index={index}
            key={media.id}
          >
            <ParallaxContainer
              key={media.id}
              media={media}
              dimension={dimension}
              index={index}
              scrollY={scrollPosition}
              modulePosition={modulePosition}
              disableParallax={disableParallax}
            />
          </CardModulePressableTool>
        );
      })}
    </View>
  );
};

export default CardModuleMediaParallax;
