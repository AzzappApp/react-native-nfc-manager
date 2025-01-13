import { getMediasByIds, type CardModuleBase } from '@azzapp/data';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  getCarouselDefaultColors,
  type CardModuleMediaData,
} from '@azzapp/shared/cardModuleHelpers';
import Original from '../../Original';
import type { ModuleRendererProps } from '../../ModuleRenderer';

export type OriginalRendererProps = ModuleRendererProps<
  CardModuleBase & {
    data: CardModuleMediaData;
  }
> &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

const OriginalRenderer = async ({
  module,
  colorPalette,
  coverBackgroundColor,
  cardStyle,
}: OriginalRendererProps) => {
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
      <Original medias={medias} cardStyle={cardStyle} />
    </div>
  );
};

export default OriginalRenderer;
