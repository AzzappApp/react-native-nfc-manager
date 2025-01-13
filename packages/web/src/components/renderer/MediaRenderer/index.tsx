import OriginalRenderer from './OriginalRenderer';
import ParallaxRenderer from './ParallaxRenderer';
import SlideshowRenderer from './SlideshowRenderer';
import type { ModuleRendererProps } from '../ModuleRenderer';
import type { CardModuleBase } from '@azzapp/data';
import type { CardModuleMediaData } from '@azzapp/shared/cardModuleHelpers';

export type MediaRendererProps = ModuleRendererProps<
  CardModuleBase & {
    data: CardModuleMediaData;
  }
> &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

const MediaRenderer = async (props: MediaRendererProps) => {
  switch (props.module.variant) {
    case 'slideshow': {
      return <SlideshowRenderer {...props} />;
    }
    case 'parallax': {
      return <ParallaxRenderer {...props} />;
    }
    case 'original': {
      return <OriginalRenderer {...props} />;
    }
    default: {
      return null;
    }
  }
};

export default MediaRenderer;
