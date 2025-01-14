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
  Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

const GridRenderer = async ({
  module,
  colorPalette,
  coverBackgroundColor,
  cardStyle,
}: GridRenderererProps) => {
  const { cardModuleMedias, cardModuleColor } = module.data;

  const medias = (
    await getMediasByIds(cardModuleMedias.map(({ media }) => media.id))
  ).filter(media => media !== null);

  const columns: any[][] = [[], [], []]; // Three columns
  const columnHeights = [0, 0, 0];
  // Simple automatic reordering
  medias.forEach(media => {
    const shortestColumnIndex = columnHeights.indexOf(
      Math.min(...columnHeights),
    );
    columns[shortestColumnIndex].push(media);
    columnHeights[shortestColumnIndex] += media.height;
  });

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
        paddingTop: 20,
        paddingBottom: 20,
      }}
    >
      <div className={styles.container} style={{ gap: cardStyle.gap }}>
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
