'use client';

import { style } from '@vanilla-extract/css';
import cn from 'classnames';
import { swapColor } from '@azzapp/shared/cardHelpers';
import Parallax from '#components/renderer/Parallax';
import { fontsMap } from '#helpers/fonts';
import commonStyles from '../MediaText.css';
import styles from './ParallaxText.css';
import type { Media } from '@azzapp/data';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { CardModuleMediaTextData } from '@azzapp/shared/cardModuleHelpers';

const ParallaxText = ({
  medias,
  data,
  colorPalette,
  cardStyle,
}: {
  medias: Media[];
  data: CardModuleMediaTextData;
  colorPalette: ColorPalette;
  cardStyle: CardStyle;
}) => {
  return (
    <Parallax medias={medias}>
      {({ mediaId }) => {
        const mediaData = data.cardModuleMedias.find(
          ({ media }) => media.id === mediaId,
        );

        return (
          <section className={styles.textContainer}>
            <h3
              style={{
                color: swapColor(data.cardModuleColor?.title, colorPalette),
                fontFamily: cardStyle.titleFontFamily,
              }}
              className={cn(
                style([styles.textItem, commonStyles.title]),
                fontsMap[cardStyle.fontFamily].className,
              )}
            >
              {mediaData?.title}
            </h3>
            <p
              style={{
                color: swapColor(data.cardModuleColor?.text, colorPalette),
                fontFamily: cardStyle.fontFamily,
              }}
              className={cn(
                style([styles.textItem, commonStyles.text]),
                fontsMap[cardStyle.fontFamily].className,
              )}
            >
              {mediaData?.text}
            </p>
          </section>
        );
      }}
    </Parallax>
  );
};

export default ParallaxText;
