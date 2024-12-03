import ParallaxRenderer from './ParallaxRenderer';
import type { ModuleRendererProps } from '../ModuleRenderer';
import type { CardModuleBase } from '@azzapp/data';
import type { CardModuleMediaTextData } from '@azzapp/shared/cardModuleHelpers';

export type MediaRendererProps = ModuleRendererProps<
  CardModuleBase & {
    data: CardModuleMediaTextData;
  }
> &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

const MediaRenderer = async (props: MediaRendererProps) => {
  switch (props.module.variant) {
    case 'parallax': {
      return <ParallaxRenderer {...props} />;
    }
    default: {
      return null;
    }
  }
};

export default MediaRenderer;
