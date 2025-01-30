'use client';
import cn from 'classnames';
import { FormattedMessage } from 'react-intl';
import {
  swapColor,
  type CardStyle,
  type ColorPalette,
} from '@azzapp/shared/cardHelpers';
import { fontsMap } from '#helpers/fonts';
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
        className={cn(styles.link, fontsMap[cardStyle.fontFamily].className)}
        style={{
          display: 'inline-flex',
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
