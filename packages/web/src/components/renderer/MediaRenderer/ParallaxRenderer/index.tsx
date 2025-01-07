import { getMediasByIds, type CardModuleBase } from '@azzapp/data';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  getCarouselDefaultColors,
  type CardModuleMediaData,
} from '@azzapp/shared/cardModuleHelpers';
import Parallax from '../../Parallax';
import type { ModuleRendererProps } from '../../ModuleRenderer';

export type ParallaxRendererProps = ModuleRendererProps<
  CardModuleBase & {
    data: CardModuleMediaData;
  }
> &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

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
      <Parallax medias={medias} />
    </div>
  );
};

export default ParallaxRenderer;
