'use client';

import cn from 'classnames';
import { swapColor } from '@azzapp/shared/cardHelpers';
import Parallax from '#components/renderer/Parallax';
import { fontsMap } from '#helpers/fonts';
import { DEFAULT_MODULE_TEXT, DEFAULT_MODULE_TITLE } from '#helpers/modules';
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
}: {
  medias: Media[];
  data: CardModuleMediaTextLinkData;
  colorPalette: ColorPalette;
  cardStyle: CardStyle;
}) => {
  return (
    <Parallax medias={medias} imageStyle={{ opacity: 0.8 }}>
      {({ mediaId }) => {
        const mediaData = data.cardModuleMedias.find(
          ({ media }) => media.id === mediaId,
        );

        return (
          <div className={styles.container}>
            <section className={styles.textContainer}>
              <h3
                style={{
                  color: swapColor(data.cardModuleColor?.title, colorPalette),
                }}
                className={cn(
                  styles.textItem,
                  commonStyles.title,
                  fontsMap[cardStyle.titleFontFamily].className,
                )}
              >
                {mediaData?.title ?? DEFAULT_MODULE_TITLE}
              </h3>
              <p
                style={{
                  color: swapColor(data.cardModuleColor?.text, colorPalette),
                }}
                className={cn(
                  styles.textItem,
                  commonStyles.text,
                  fontsMap[cardStyle.fontFamily].className,
                )}
              >
                {mediaData?.text ?? DEFAULT_MODULE_TEXT}
              </p>
            </section>

            <Link
              mediaData={mediaData}
              data={data}
              cardStyle={cardStyle}
              colorPalette={colorPalette}
            />
          </div>
        );
      }}
    </Parallax>
  );
};

export default ParallaxText;
