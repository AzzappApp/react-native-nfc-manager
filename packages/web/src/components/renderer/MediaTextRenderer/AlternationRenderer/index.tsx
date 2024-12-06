import cn from 'classnames';
import { getMediasByIds, type CardModuleBase } from '@azzapp/data';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  getCarouselDefaultColors,
  type CardModuleMediaTextData,
} from '@azzapp/shared/cardModuleHelpers';
import { fontsMap } from '#helpers/fonts';
import commonStyles from '../MediaText.css';
import AlternationImage from './AlternationImage';
import styles from './AlternationRenderer.css';

import type { ModuleRendererProps } from '../../ModuleRenderer';
import type { ReactNode } from 'react';

export type AlternationRendererProps = ModuleRendererProps<
  CardModuleBase & {
    data: CardModuleMediaTextData;
  }
> &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'> & {
    renderMediaOverlay?: (props: { mediaId: string }) => ReactNode;
  };

const AlternationRender = async ({
  module,
  colorPalette,
  coverBackgroundColor,
  cardStyle,
}: AlternationRendererProps) => {
  const { cardModuleMedias, cardModuleColor } = module.data;

  const medias = (
    await getMediasByIds(cardModuleMedias.map(({ media }) => media.id))
  ).filter(media => media !== null);

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
      <div className={styles.container}>
        {medias.map((media, index) => {
          const sectionData = cardModuleMedias.find(
            cardModuleMedia => cardModuleMedia.media.id === media.id,
          );

          return (
            <div
              key={media.id}
              className={
                index % 2 === 0
                  ? styles.sectionContainerEven
                  : styles.sectionContainer
              }
            >
              <AlternationImage
                media={media}
                even={index % 2 === 0}
                cardStyle={cardStyle}
              />
              <section className={styles.sectionTextContainer}>
                <h3
                  className={cn(
                    commonStyles.title,
                    fontsMap[cardStyle.titleFontFamily].className,
                  )}
                  style={{
                    color: swapColor(cardModuleColor?.title, colorPalette),
                  }}
                >
                  {sectionData?.title}
                </h3>
                <p
                  className={cn(
                    commonStyles.text,
                    fontsMap[cardStyle.fontFamily].className,
                  )}
                  style={{
                    color: swapColor(cardModuleColor?.text, colorPalette),
                  }}
                >
                  {sectionData?.text}
                </p>
              </section>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlternationRender;
