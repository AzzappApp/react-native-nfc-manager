import AlternationRenderer from './AlternationRenderer';
import ParallaxRenderer from './ParallaxRenderer';
import SimpleCarouselRenderer from './SimpleCarouselRenderer';
import type { ModuleRendererProps } from '../ModuleRenderer';
import type { CardModuleBase } from '@azzapp/data';
import type {
  CardModuleMediaTextData,
  CardModuleMediaTextLinkData,
} from '@azzapp/shared/cardModuleHelpers';

export type MediaRendererTextProps = ModuleRendererProps<
  CardModuleBase & {
    data: CardModuleMediaTextData | CardModuleMediaTextLinkData;
  }
> &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

const MediaRenderer = async (props: MediaRendererTextProps) => {
  switch (props.module.variant) {
    case 'parallax':
      return <ParallaxRenderer {...props} />;
    case 'alternation':
      return <AlternationRenderer {...props} />;
    case 'full_alternation':
      return <AlternationRenderer {...props} isFullAlternation />;
    case 'simple_carousel':
      return <SimpleCarouselRenderer {...props} />;
    default: {
      return null;
    }
  }
};

export default MediaRenderer;
