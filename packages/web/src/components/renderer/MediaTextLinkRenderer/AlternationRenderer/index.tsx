import cn from 'classnames';
import { getMediasByIds, type CardModuleBase } from '@azzapp/data';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  getCarouselDefaultColors,
  type CardModuleMediaTextLinkData,
  type CardModuleMediaTextData,
} from '@azzapp/shared/cardModuleHelpers';
import { fontsMap } from '#helpers/fonts';
import { DEFAULT_MODULE_TEXT, DEFAULT_MODULE_TITLE } from '#helpers/modules';
import Link from '../Link';
import commonStyles from '../MediaTextLink.css';
import AlternationMedia from './AlternationMedia';
import styles from './AlternationRenderer.css';

import type { ModuleRendererProps } from '../../ModuleRenderer';
import type { ReactNode } from 'react';

export type AlternationRendererProps = ModuleRendererProps<
  CardModuleBase & {
    data: CardModuleMediaTextData | CardModuleMediaTextLinkData;
  }
> &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'> & {
    renderMediaOverlay?: (props: { mediaId: string }) => ReactNode;
  } & { isFullAlternation?: boolean };

const AlternationRender = async ({
  module,
  colorPalette,
  coverBackgroundColor,
  cardStyle,
  isFullAlternation,
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
      <div
        className={
          isFullAlternation ? styles.containerFullAlternation : styles.container
        }
      >
        {medias.map((media, index) => {
          const sectionData = cardModuleMedias.find(
            cardModuleMedia => cardModuleMedia.media.id === media.id,
          );
          const even = index % 2 === 0;
          return (
            <div
              key={media.id}
              className={
                even
                  ? isFullAlternation
                    ? styles.sectionFullAlternationContainerEven
                    : styles.sectionContainerEven
                  : isFullAlternation
                    ? styles.sectionFullAlternationContainer
                    : styles.sectionContainer
              }
            >
              <div className={styles.columnWidth}>
                <AlternationMedia
                  media={media}
                  even={even}
                  cardStyle={cardStyle}
                  isFullAlternation={isFullAlternation}
                />
              </div>
              <div className={styles.columnWidth}>
                <div
                  className={
                    isFullAlternation
                      ? styles.sectionTextFullAlternationContainer
                      : styles.sectionTextContainer
                  }
                >
                  <section
                    className={
                      isFullAlternation
                        ? styles.sectionFullAlternation
                        : styles.section
                    }
                    style={{
                      padding: isFullAlternation
                        ? undefined
                        : `0 ${Math.max(cardStyle.gap, 20)}px`,
                    }}
                  >
                    <h2
                      className={cn(
                        commonStyles.title,
                        fontsMap[cardStyle.titleFontFamily].className,
                      )}
                      style={{
                        color: swapColor(cardModuleColor?.title, colorPalette),
                        fontSize: cardStyle.titleFontSize,
                      }}
                    >
                      {sectionData?.title ?? DEFAULT_MODULE_TITLE}
                    </h2>
                    <p
                      className={cn(
                        commonStyles.text,
                        fontsMap[cardStyle.fontFamily].className,
                      )}
                      style={{
                        color: swapColor(cardModuleColor?.text, colorPalette),
                        fontSize: cardStyle.fontSize,
                      }}
                    >
                      {sectionData?.text ?? DEFAULT_MODULE_TEXT}
                    </p>
                    <Link
                      mediaData={sectionData}
                      data={module.data}
                      cardStyle={cardStyle}
                      colorPalette={colorPalette}
                    />
                  </section>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlternationRender;
