'use client';
import { FormattedMessage } from 'react-intl';
import {
  swapColor,
  type CardStyle,
  type ColorPalette,
} from '@azzapp/shared/cardHelpers';
import styles from './MediaTextLink.css';
import type { CardModuleMediaTextLinkData } from '@azzapp/shared/cardModuleHelpers';

const Link = ({
  mediaData,
  colorPalette,
  cardStyle,
  data,
}: {
  mediaData?: {
    link?: {
      url: string;
      label: string;
    };
  };
  data: CardModuleMediaTextLinkData;
  cardStyle: CardStyle;
  colorPalette: ColorPalette;
}) => {
  return (
    mediaData?.link && (
      <a
        href={mediaData.link?.url}
        className={styles.link}
        style={{
          backgroundColor: swapColor(
            data.cardModuleColor?.content,
            colorPalette,
          ),
          color: swapColor(data.cardModuleColor?.graphic, colorPalette),
          borderRadius: cardStyle?.buttonRadius,
        }}
      >
        {mediaData?.link?.label ?? (
          <FormattedMessage
            defaultMessage="Open"
            id="NBmHdS"
            description="CardModuleTextLinkParallax - default action button label"
          />
        )}
      </a>
    )
  );
};

export default Link;
