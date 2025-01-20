import { getMediasByIds } from '@azzapp/data';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  getCarouselDefaultColors,
  type CardModuleMediaData,
} from '@azzapp/shared/cardModuleHelpers';
import GridItem from './GridItem';
import styles from './index.css';
import type { ModuleRendererProps } from '../../ModuleRenderer';
import type { CardModuleBase } from '@azzapp/data';

export type GridRenderererProps = ModuleRendererProps<
  CardModuleBase & {
    data: CardModuleMediaData;
  }
> &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'> & {
    square?: boolean;
    nbColumns?: number;
  };

const GridRenderer = async ({
  module,
  colorPalette,
  coverBackgroundColor,
  cardStyle,
  square = false,
  nbColumns = 3,
}: GridRenderererProps) => {
  const { cardModuleMedias, cardModuleColor } = module.data;

  const medias = (
    await getMediasByIds(cardModuleMedias.map(({ media }) => media.id))
  ).filter(media => media !== null);

  const columns: any[][] = Array.from({ length: nbColumns }, () => []);
  const columnHeights: number[] = Array(nbColumns).fill(0);
  // Simple automatic reordering
  if (square) {
    //no reordering, just fill the columns and offsetY
    medias.forEach((media, index) => {
      const columnIndex = index % nbColumns;
      columns[columnIndex].push(media);
    });
  } else {
    medias.forEach(media => {
      const shortestColumnIndex = columnHeights.indexOf(
        Math.min(...columnHeights),
      );
      columns[shortestColumnIndex].push(media);
      //we need a fixed with to calculate the height in order to sort
      columnHeights[shortestColumnIndex] += media.height / media.width;
    });
  }

  return (
    <div
      style={{
        zIndex: 1,
        backgroundColor: swapColor(
          cardModuleColor?.background ??
            getCarouselDefaultColors(coverBackgroundColor)?.backgroundStyle
              ?.backgroundColor,
          colorPalette,
        ),
      }}
    >
      <div
        className={styles.container}
        style={{ padding: cardStyle.gap, gap: cardStyle.gap }}
      >
        {columns.map((column, columnIndex) => (
          <div
            key={columnIndex}
            className={styles.column}
            style={{ gap: cardStyle.gap }}
          >
            {column.map((media, index) => {
              return (
                <GridItem
                  key={`${media.id}_${index}`}
                  media={media}
                  cardStyle={cardStyle}
                  square={square}
                  index={index}
                  delaySec={columnIndex * 0.1}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GridRenderer;
