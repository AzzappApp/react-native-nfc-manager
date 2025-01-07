import { getMediasByIds, type Media, type CardModuleBase } from '@azzapp/data';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  getCarouselDefaultColors,
  type CardModuleMediaData,
} from '@azzapp/shared/cardModuleHelpers';
import Slideshow from './Slideshow';
import type { ModuleRendererProps } from '../../ModuleRenderer';

export type SlideshowRendererProps = ModuleRendererProps<
  CardModuleBase & {
    data: CardModuleMediaData;
  }
> &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

const SlideshowRenderer = async ({
  module,
  colorPalette,
  coverBackgroundColor,
  cardStyle,
}: SlideshowRendererProps) => {
  const { cardModuleMedias, cardModuleColor } = module.data;

  const medias = (
    await getMediasByIds(cardModuleMedias.map(({ media }) => media.id))
  ).filter(media => media !== null);

  const shown: Media[] = [...medias];

  if (medias.length > 0) {
    while (shown.length < 10) {
      shown.push(...medias);
    }
  }

  return (
    <Slideshow
      medias={shown}
      style={{
        paddingTop: 20,
        paddingBottom: 20,
        zIndex: 1,
        backgroundColor: swapColor(
          cardModuleColor?.background ??
            getCarouselDefaultColors(coverBackgroundColor)?.backgroundStyle
              ?.backgroundColor,
          colorPalette,
        ),
      }}
      square
      borderRadius={cardStyle.borderRadius}
    />
  );
};

export default SlideshowRenderer;
