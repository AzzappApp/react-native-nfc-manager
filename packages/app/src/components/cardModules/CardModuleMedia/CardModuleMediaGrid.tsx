import { memo, useCallback, useMemo, useState } from 'react';
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
  nbColumns?: number;
};

const CardModuleMediaGrid = ({
  cardModuleMedias,
  cardModuleColor,
  dimension: providedDimension,
  onLayout,
  cardStyle,
  scrollPosition,
  square = false,
  nbColumns = 3,
  webCardViewMode,
  ...props
}: CardModuleMediaGridProps) => {
  'use no memo';
  const screenDimension = useScreenDimensions();
  const dimension = providedDimension ?? screenDimension;

  if (!scrollPosition) {
    throw new Error(
      'CardModuleMediaGrid : the media grid component require a scrollPosition',
    );
  }

  // we need to calculate the startPoint of each item in the grid(whichs a 3 column grid). It will allow to start the appearance animation at the right scrolling position
  const [itemYStartPoint, setItemYStartPoint] = useState<number[][]>(
    Array.from({ length: nbColumns }, () => []),
  );
  //determine size of columns
  const columnWidth = useMemo(() => {
    return (
      (dimension.width - (nbColumns + 1) * (cardStyle?.gap ?? 0)) / nbColumns
    );
  }, [cardStyle?.gap, dimension.width, nbColumns]);

  const columns = useMemo(() => {
    const result: CardModuleMedia[][] = Array.from(
      { length: nbColumns },
      () => [],
    ); // Three columns grid
    const offsetY: number[][] = Array.from({ length: nbColumns }, () => [0]); // Three columns grid
    const columnHeights = Array(nbColumns).fill(0);

    if (square) {
      //no reordering, just fill the columns and offsetY
      cardModuleMedias.forEach((item, index) => {
        const columnIndex = index % nbColumns;
        result[columnIndex].push(item);
        offsetY[columnIndex].push(columnHeights[columnIndex] + columnWidth);
      });
    } else {
      //simple automatic reordering
      cardModuleMedias.forEach(item => {
        const shortestColumnIndex = columnHeights.indexOf(
          Math.min(...columnHeights),
        );
        result[shortestColumnIndex].push(item);
        const lastIndex = offsetY[shortestColumnIndex].length - 1;
        const lastValue = offsetY[shortestColumnIndex][lastIndex];

        offsetY[shortestColumnIndex].push(
          lastValue + columnWidth * (item.media.height / item.media.width),
        );
        //use classic height to have the exact same algorithm as the web
        columnHeights[shortestColumnIndex] +=
          columnWidth * (item.media.height / item.media.width);
      });
    }
    // TODO THIS IS COMPLETELY WRONG AND NEEDS TO BE FIXED AZZAPPPP :p
    // eslint-disable-next-line react-compiler/react-compiler
    setItemYStartPoint(offsetY);

    if (webCardViewMode === 'edit' && nbColumns === 1 && result[0]) {
      // ensure we display only the first item in edit mode
      result[0] = result[0].slice(0, 1);
    }
    return result;
  }, [cardModuleMedias, columnWidth, nbColumns, square, webCardViewMode]);

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
            const offsetY = itemYStartPoint[columnIndex]
              ? itemYStartPoint[columnIndex][index]
              : 0;
            return (
              <GridItem
                {...props}
                webCardViewMode={webCardViewMode}
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
                offsetY={offsetY + (cardStyle?.gap ?? 0) * index}
                delaySec={columnIndex * 0.1}
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
  delaySec: number;
};

const GridItemComponent = ({
  setEditableItemIndex,
  index,
  ...props
}: GridItemProps) => {
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

const GridItem = memo(GridItemComponent);

export default memo(CardModuleMediaGrid);
