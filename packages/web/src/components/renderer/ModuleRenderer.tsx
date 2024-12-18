import BlockTextRenderer from './BlockTextRenderer';
import CarouselRenderer from './CarouselRenderer';
import HorizontalPhotoRenderer from './HorizontalPhotoRenderer';
import LineDividerRenderer from './LineDividerRenderer';
import PhotoWithTextAndTitleRenderer from './PhotoWithTextAndTitleRenderer';
import SimpleButtonRenderer from './SimpleButtonRenderer';
import SimpleTextRenderer from './SimpleTextRenderer';
import SocialLinksRenderer from './SocialLinksRenderer';
import type { CardModule } from '@azzapp/data';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { ComponentType } from 'react';

export type ModuleRendererProps<TModule extends CardModule> = {
  module: TModule;
  cardStyle: CardStyle;
  colorPalette: ColorPalette;
  resizeModes: Map<string, string>;
  coverBackgroundColor: string | null;
};

const ModuleRenderer = <TModule extends CardModule>({
  module,
  cardStyle,
  colorPalette,
  coverBackgroundColor,
  resizeModes,
}: ModuleRendererProps<TModule>) => {
  const Renderer = renderers[module.kind] as any;
  if (!Renderer) {
    return null;
  }

  return (
    <Renderer
      module={module}
      cardStyle={cardStyle}
      colorPalette={colorPalette}
      resizeModes={resizeModes}
      coverBackgroundColor={coverBackgroundColor}
    />
  );
};

const renderers: {
  [TModule in CardModule as TModule['kind']]: ComponentType<
    ModuleRendererProps<TModule>
  >;
} = {
  blockText: BlockTextRenderer,
  carousel: CarouselRenderer,
  horizontalPhoto: HorizontalPhotoRenderer,
  imageGrid: () => null,
  lineDivider: LineDividerRenderer,
  parallax: () => null,
  photoWithTextAndTitle: PhotoWithTextAndTitleRenderer,
  simpleButton: SimpleButtonRenderer,
  simpleTitle: SimpleTextRenderer,
  simpleText: SimpleTextRenderer,
  socialLinks: SocialLinksRenderer,
  schedule: () => null,
  video: () => null,
  webCardsCarousel: () => null,
};

export default ModuleRenderer;
