'use client';

import { swapColor } from '@azzapp/shared/cardHelpers';
import Parallax from '#components/renderer/Parallax';
import styles from './ParallaxText.css';
import type { Media } from '@azzapp/data';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';
import type { CardModuleMediaTextData } from '@azzapp/shared/cardModuleHelpers';

const ParallaxText = ({
  medias,
  data,
  colorPalette,
}: {
  medias: Media[];
  data: CardModuleMediaTextData;
  colorPalette: ColorPalette;
}) => {
  return (
    <Parallax medias={medias}>
      {({ mediaId }) => {
        const mediaData = data.cardModuleMedias.find(
          ({ media }) => media.id === mediaId,
        );

        return (
          <div className={styles.textContainer}>
            <h3
              style={{
                color: swapColor(data.cardModuleColor?.title, colorPalette),
                fontSize: 34,
              }}
              className={styles.textItem}
            >
              {mediaData?.title}
            </h3>
            <p
              style={{
                color: swapColor(data.cardModuleColor?.text, colorPalette),
                fontSize: 16,
              }}
              className={styles.textItem}
            >
              {mediaData?.text}
            </p>
          </div>
        );
      }}
    </Parallax>
  );
};

export default ParallaxText;
