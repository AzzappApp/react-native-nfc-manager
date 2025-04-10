import { getMediasByIds } from '@azzapp/data';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  getCarouselDefaultColors,
  type CardModuleMediaData,
} from '@azzapp/shared/cardModuleHelpers';
import SimpleCarousel from './SimpleCarousel';
import type { ModuleRendererProps } from '../../ModuleRenderer';
import type { CardModuleBase } from '@azzapp/data';

export type SlideshowRendererProps = ModuleRendererProps<
  CardModuleBase & {
    data: CardModuleMediaData;
  }
> &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

const SimpleCarouselRenderer = async ({
  module,
  colorPalette,
  coverBackgroundColor,
  cardStyle,
}: SlideshowRendererProps) => {
  const { cardModuleMedias, cardModuleColor } = module.data;

  const medias = (
    await getMediasByIds(cardModuleMedias.map(({ media }) => media.id))
  ).filter(media => media !== null);

  return (
    <SimpleCarousel
      medias={medias}
      style={{
        paddingTop: Math.max(10, cardStyle?.gap || 0),
        paddingBottom: Math.max(cardStyle.gap || 20),
        zIndex: 1,
        backgroundColor: swapColor(
          cardModuleColor?.background ??
            getCarouselDefaultColors(coverBackgroundColor)?.backgroundStyle
              ?.backgroundColor,
          colorPalette,
        ),
      }}
      cardStyle={cardStyle}
      module={module}
      colorPalette={colorPalette}
    />
  );
};

export default SimpleCarouselRenderer;
