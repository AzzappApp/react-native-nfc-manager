import AlternationRenderer from './AlternationRenderer';
import ParallaxRenderer from './ParallaxRenderer';
import type { ModuleRendererProps } from '../ModuleRenderer';
import type { CardModuleBase } from '@azzapp/data';
import type { CardModuleMediaTextData } from '@azzapp/shared/cardModuleHelpers';

export type MediaRendererTextProps = ModuleRendererProps<
  CardModuleBase & {
    data: CardModuleMediaTextData;
  }
> &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

const MediaRenderer = async (props: MediaRendererTextProps) => {
  switch (props.module.variant) {
    case 'parallax':
      return <ParallaxRenderer {...props} />;
    case 'alternation':
      return <AlternationRenderer {...props} />;
    default: {
      return null;
    }
  }
};

export default MediaRenderer;
