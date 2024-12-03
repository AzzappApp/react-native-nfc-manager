import { getMediasByIds, type CardModuleBase } from '@azzapp/data';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  getCarouselDefaultColors,
  type CardModuleMediaTextData,
} from '@azzapp/shared/cardModuleHelpers';
import ParallaxText from './ParallaxText';

import type { ModuleRendererProps } from '../../ModuleRenderer';
import type { ReactNode } from 'react';

export type ParallaxRendererProps = ModuleRendererProps<
  CardModuleBase & {
    data: CardModuleMediaTextData;
  }
> &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'> & {
    renderMediaOverlay?: (props: { mediaId: string }) => ReactNode;
  };

const ParallaxRenderer = async ({
  module,
  colorPalette,
  coverBackgroundColor,
}: ParallaxRendererProps) => {
  const { cardModuleMedias, cardModuleColor } = module.data;

  const medias = (
    await getMediasByIds(cardModuleMedias.map(({ media }) => media.id))
  ).filter(media => media !== null);

  return (
    <div
      style={{
        backgroundColor: swapColor(
          cardModuleColor?.background ??
            getCarouselDefaultColors(coverBackgroundColor)?.backgroundStyle
              ?.backgroundColor,
          colorPalette,
        ),
      }}
    >
      <ParallaxText
        medias={medias}
        data={module.data}
        colorPalette={colorPalette}
      />
    </div>
  );
};

export default ParallaxRenderer;
