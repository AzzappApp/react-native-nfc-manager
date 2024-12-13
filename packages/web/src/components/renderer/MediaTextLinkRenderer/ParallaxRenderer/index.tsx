import { getMediasByIds, type CardModuleBase } from '@azzapp/data';
import { swapColor } from '@azzapp/shared/cardHelpers';
import { getCarouselDefaultColors } from '@azzapp/shared/cardModuleHelpers';
import ParallaxTextLink from './ParallaxTextLink';

import type { ModuleRendererProps } from '../../ModuleRenderer';
import type {
  CardModuleMediaTextData,
  CardModuleMediaTextLinkData,
} from '@azzapp/shared/cardModuleHelpers';
import type { ReactNode } from 'react';

export type ParallaxRendererProps = ModuleRendererProps<
  CardModuleBase & {
    data: CardModuleMediaTextData | CardModuleMediaTextLinkData;
  }
> &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'> & {
    renderMediaOverlay?: (props: { mediaId: string }) => ReactNode;
  };

const ParallaxRenderer = async ({
  cardStyle,
  module,
  colorPalette,
  coverBackgroundColor,
}: ParallaxRendererProps) => {
  const { cardModuleMedias, cardModuleColor } = module.data;

  const medias = (
    await getMediasByIds(cardModuleMedias.map(({ media }) => media.id))
  ).filter(media => media !== null);

  return (
    <ParallaxTextLink
      backgroundColor={swapColor(
        cardModuleColor?.background ??
          getCarouselDefaultColors(coverBackgroundColor)?.backgroundStyle
            ?.backgroundColor,
        colorPalette,
      )}
      medias={medias}
      data={module.data}
      colorPalette={colorPalette}
      cardStyle={cardStyle}
    />
  );
};

export default ParallaxRenderer;
