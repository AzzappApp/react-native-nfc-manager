import BlockTextRenderer from './BlockTextRenderer';
import CarouselRenderer from './CarouselRenderer';
import HorizontalPhotoRenderer from './HorizontalPhotoRenderer';
import LineDividerRenderer from './LineDividerRenderer';
import PhotoWithTextAndTitleRenderer from './PhotoWithTextAndTitleRenderer';
import SimpleButtonRenderer from './SimpleButtonRenderer';
import SimpleTextRenderer from './SimpleTextRenderer';
import SocialLinksRenderer from './SocialLinksRenderer';
import type { CardModule } from '@azzapp/data/domains';
import type { ComponentType } from 'react';

type ModuleRendererProps = {
  module: CardModule;
};

const ModuleRenderer = (props: ModuleRendererProps) => {
  const { module } = props;

  const Renderer = renderers[module.kind];
  if (!Renderer) return null;

  return <Renderer module={module} />;
};

const renderers = {
  blockText: BlockTextRenderer,
  carousel: CarouselRenderer,
  horizontalPhoto: HorizontalPhotoRenderer,
  lineDivider: LineDividerRenderer,
  photoWithTextAndTitle: PhotoWithTextAndTitleRenderer,
  simpleButton: SimpleButtonRenderer,
  simpleTitle: SimpleTextRenderer,
  simpleText: SimpleTextRenderer,
  socialLinks: SocialLinksRenderer,
  openingHours: () => null,
  webCardsCarousel: () => null,
} satisfies Record<CardModule['kind'], ComponentType<ModuleRendererProps>>;

export default ModuleRenderer;
