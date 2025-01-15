import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import useScreenDimensions from '#hooks/useScreenDimensions';
import AppearanceSliderContainer from '../AppearanceSliderContainer';
import CardModulePressableTool from '../tool/CardModulePressableTool';
import type { AppearanceSliderContainerProps } from '../AppearanceSliderContainer';
import type {
  CardModuleMedia,
  CardModuleVariantType,
} from '../cardModuleEditorType';
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
  displayMode,
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

  const displayedWidth = dimension.width - (cardStyle?.gap || 0) * 2;

  const offsetY = useMemo(() => {
    return items.reduce(
      (acc, { media }, index) => {
        if (index === 0) {
          acc.push((displayedWidth * media.height) / media.width);
        } else {
          acc.push(
            acc[index - 1] + (displayedWidth * media.height) / media.width,
          );
        }
        return acc;
      },
      [0] as number[],
    );
  }, [displayedWidth, items]);

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
            displayDimension={{
              width: displayedWidth,
              height: (displayedWidth * media.height) / media.width,
            }}
            dimension={dimension}
            displayMode={displayMode}
            cardStyle={cardStyle}
            setEditableItemIndex={setEditableItemIndex}
            modulePosition={modulePosition}
            index={index}
            canPlay={canPlay}
            scrollY={scrollPosition}
            offsetY={offsetY[index]}
            webCardViewMode={webCardViewMode}
          />
        );
      })}
    </View>
  );
};
type OriginalItemProps = Omit<AppearanceSliderContainerProps, 'parentY'> & {
  setEditableItemIndex?: (index: number) => void;
};
const OriginalItem = ({
  setEditableItemIndex,
  index,
  dimension,
  cardStyle,
  ...props
}: OriginalItemProps) => {
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
      <AppearanceSliderContainer
        {...props}
        dimension={dimension}
        parentY={parentY}
        index={index}
        cardStyle={cardStyle}
      />
    </CardModulePressableTool>
  );
};

export default CardModuleMediaOriginal;
