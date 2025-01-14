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
import type { LayoutChangeEvent, Animated } from 'react-native';

type CardModuleMediaGridProps = CardModuleVariantType & {
  cardModuleMedias: CardModuleMedia[];
  onLayout?: (event: LayoutChangeEvent) => void;
  scrollPosition?: Animated.Value;
  modulePosition?: number;
  square?: boolean; //for futur usage of square grid (view with @upmitt)
};

const CardModuleMediaGrid = ({
  cardModuleMedias,
  cardModuleColor,
  dimension: providedDimension,
  onLayout,
  cardStyle,
  scrollPosition,
  square = false,
  ...props
}: CardModuleMediaGridProps) => {
  const screenDimension = useScreenDimensions();
  const dimension = providedDimension ?? screenDimension;

  if (!scrollPosition) {
    throw new Error(
      'CardModuleMediaGrid : the media grid component require a scrollPosition',
    );
  }

  // we need to calculate the startPoint of each item in the grid(whichs a 3 column grid). It will allow to start the appearance animation at the right scrolling position
  const [itemYStartPoint, setItemYStartPoint] = useState<number[][]>([
    [],
    [],
    [],
  ]);

  const columns = useMemo(() => {
    const result: CardModuleMedia[][] = [[], [], []]; // Three columns grid
    const caculatedHeight: number[][] = [[0], [0], [0]];
    const columnHeights = [0, 0, 0];
    //simple automatic reordering
    cardModuleMedias.forEach(item => {
      const itemHeight =
        (dimension.width / 3) * (item.media.height / item.media.width);
      const shortestColumnIndex = columnHeights.indexOf(
        Math.min(...columnHeights),
      );

      result[shortestColumnIndex].push(item);
      caculatedHeight[shortestColumnIndex].push(
        columnHeights[shortestColumnIndex] + itemHeight,
      );
      columnHeights[shortestColumnIndex] += itemHeight;
    });
    setItemYStartPoint(caculatedHeight);
    return result;
  }, [cardModuleMedias, dimension.width]);
  //determine size of columns
  const columnWidth = useMemo(() => {
    return (dimension.width - 4 * (cardStyle?.gap ?? 0)) / 3;
  }, [cardStyle?.gap, dimension.width]);

  return (
    <View
      onLayout={onLayout}
      style={{
        backgroundColor: cardModuleColor.background,
        gap: cardStyle?.gap ?? 0,
        flexDirection: 'row',
        padding: cardStyle?.gap ?? 0,
      }}
    >
      {columns.map((column, columnIndex) => (
        <View
          key={columnIndex}
          style={{ width: columnWidth, gap: cardStyle?.gap ?? 0 }}
        >
          {column.map((cardModuleMedia, index) => {
            return (
              <GridItem
                {...props}
                key={`${cardModuleMedia.media.id}_${index}`}
                media={cardModuleMedia.media}
                dimension={dimension}
                displayDimension={{
                  width: columnWidth,
                  height: square
                    ? columnWidth
                    : (columnWidth * cardModuleMedia.media.height) /
                      cardModuleMedia.media.width,
                }}
                cardStyle={cardStyle}
                index={index}
                scrollY={scrollPosition}
                offsetY={
                  itemYStartPoint[columnIndex][index] +
                  (cardStyle?.gap ?? 0) * index
                }
              />
            );
          })}
        </View>
      ))}
    </View>
  );
};
type GridItemProps = Omit<AppearanceSliderContainerProps, 'parentY'> & {
  setEditableItemIndex?: (index: number) => void;
};

const GridItem = ({ setEditableItemIndex, index, ...props }: GridItemProps) => {
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
      <AppearanceSliderContainer {...props} parentY={parentY} index={index} />
    </CardModulePressableTool>
  );
};

export default CardModuleMediaGrid;
