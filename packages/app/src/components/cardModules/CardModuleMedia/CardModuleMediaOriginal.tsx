import { useCallback } from 'react';
import { View } from 'react-native';
import useScreenDimensions from '#hooks/useScreenDimensions';
import OriginalContainer from '../OriginalContainer';
import CardModulePressableTool from '../tool/CardModulePressableTool';
import type {
  CardModuleDimension,
  CardModuleMedia,
  CardModuleSourceMedia,
  CardModuleVariantType,
} from '../cardModuleEditorType';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type { LayoutChangeEvent, Animated as RNAnimated } from 'react-native';

type CardModuleMediaOriginalProps = CardModuleVariantType & {
  cardModuleMedias: CardModuleMedia[];
  onLayout?: (event: LayoutChangeEvent) => void;
  scrollPosition?: RNAnimated.Value;
  modulePosition?: number;
};

const CardModuleMediaOriginal = ({
  scrollPosition,
  modulePosition,
  onLayout,
  cardModuleMedias,
  canPlay,
  setEditableItemIndex,
  webCardViewMode,
  cardStyle,
  dimension: providedDimension,
}: CardModuleMediaOriginalProps & {}) => {
  if (!scrollPosition) {
    throw new Error('CardModuleMediaOriginal: no scrollPosition');
  }

  const screenDimension = useScreenDimensions();
  const dimension = providedDimension ?? screenDimension;
  const items =
    webCardViewMode === 'edit'
      ? cardModuleMedias.slice(0, 1)
      : cardModuleMedias;

  return (
    <View
      style={{ gap: cardStyle?.gap || 0, padding: cardStyle?.gap || 0 }}
      onLayout={onLayout}
    >
      {items.map(({ media }, index) => {
        return (
          <OriginalItem
            key={`${media.id}_${index}`}
            media={media}
            index={index}
            canPlay={canPlay}
            setEditableItemIndex={setEditableItemIndex}
            scrollPosition={scrollPosition}
            modulePosition={modulePosition}
            cardStyle={cardStyle}
            dimension={dimension}
          />
        );
      })}
    </View>
  );
};

const OriginalItem = ({
  media,
  index,
  scrollPosition,
  modulePosition,
  canPlay,
  setEditableItemIndex,
  cardStyle,
  dimension,
}: {
  media: CardModuleSourceMedia;
  index: number;
  scrollPosition: RNAnimated.Value;
  modulePosition?: number;
  canPlay: boolean;
  cardStyle?: CardStyle | null;
  setEditableItemIndex?: (index: number) => void;
  dimension: CardModuleDimension;
}) => {
  const onPress = useCallback(() => {
    setEditableItemIndex?.(index);
  }, [index, setEditableItemIndex]);

  return (
    <CardModulePressableTool active={!!setEditableItemIndex} onPress={onPress}>
      <OriginalContainer
        media={media}
        index={index}
        scrollY={scrollPosition}
        modulePosition={modulePosition}
        canPlay={canPlay}
        cardStyle={cardStyle}
        dimension={dimension}
      />
    </CardModulePressableTool>
  );
};

export default CardModuleMediaOriginal;
