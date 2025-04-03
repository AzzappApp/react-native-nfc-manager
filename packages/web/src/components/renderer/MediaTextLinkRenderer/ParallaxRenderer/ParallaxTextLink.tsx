'use client';

import cn from 'classnames';
import { swapColor } from '@azzapp/shared/cardHelpers';
import Parallax from '#components/renderer/Parallax';
import { webCardTextFontsMap, webCardTitleFontsMap } from '#helpers/fonts';
import { DEFAULT_MODULE_TEXT, DEFAULT_MODULE_TITLE } from '#helpers/modules';
import RichText from '#ui/RichText';
import Link from '../Link';
import commonStyles from '../MediaTextLink.css';
import styles from './ParallaxTextLink.css';
import type { Media } from '@azzapp/data';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { CardModuleMediaTextLinkData } from '@azzapp/shared/cardModuleHelpers';

const ParallaxText = ({
  medias,
  data,
  colorPalette,
  cardStyle,
  backgroundColor,
}: {
  medias: Media[];
  data: CardModuleMediaTextLinkData;
  colorPalette: ColorPalette;
  cardStyle: CardStyle;
  backgroundColor?: string;
}) => {
  return (
    <Parallax medias={medias}>
      {({ mediaId }) => {
        const mediaData = data.cardModuleMedias.find(
          ({ media }) => media.id === mediaId,
        );

        return (
          <>
            <div style={{ backgroundColor }} className={styles.overlay} />

            <div className={styles.container}>
              <section className={styles.textContainer}>
                <h2
                  style={{
                    color: swapColor(data.cardModuleColor?.title, colorPalette),
                    fontSize: cardStyle.titleFontSize,
                  }}
                  className={cn(
                    styles.textItem,
                    commonStyles.title,
                    webCardTitleFontsMap[cardStyle.titleFontFamily].className,
                  )}
                >
                  <RichText
                    fontFamily={cardStyle.titleFontFamily}
                    text={mediaData?.title ?? DEFAULT_MODULE_TITLE}
                    textFontSize={
                      cardStyle.titleFontSize || commonStyles.titleFontSize
                    }
                  />
                </h2>
                <p
                  style={{
                    color: swapColor(data.cardModuleColor?.text, colorPalette),
                    fontSize: cardStyle.fontSize,
                  }}
                  className={cn(
                    styles.textItem,
                    commonStyles.text,
                    webCardTextFontsMap[cardStyle.fontFamily].className,
                  )}
                >
                  <RichText
                    fontFamily={cardStyle.fontFamily}
                    text={mediaData?.text ?? DEFAULT_MODULE_TEXT}
                    textFontSize={
                      cardStyle.fontSize || commonStyles.textFontSize
                    }
                  />
                </p>
              </section>
              <Link
                mediaData={mediaData}
                data={data}
                cardStyle={cardStyle}
                colorPalette={colorPalette}
              />
            </div>
          </>
        );
      }}
    </Parallax>
  );
};

export default ParallaxText;
