import { graphql, readInlineData } from 'react-relay';
import CardModuleEditionScrollHandler from '../CardModuleEditionScrollHandler';
import withSwapCardModuleColor from '../withSwapCardModuleColor';
import CardModuleMediaTextLinkAlternation from './CardModuleMediaTextLinkAlternation';
import CardModuleMediaTextLinkParallax from './CardModuleMediaTextLinkParallax';
import type {
  MediaTextLinkModuleRenderer_module$data,
  MediaTextLinkModuleRenderer_module$key,
} from '#relayArtifacts/MediaTextLinkModuleRenderer_module.graphql';

import type {
  CardModuleMedia,
  CommonModuleRendererProps,
} from '../cardModuleEditorType';
import type { CardModuleColor } from '@azzapp/shared/cardModuleHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';

/**
 * Render a SimpleButton module
 */
export const MediaTextLinkModuleRendererFragment = graphql`
  fragment MediaTextLinkModuleRenderer_module on CardModuleMediaTextLink
  @inline
  @argumentDefinitions(
    screenWidth: { type: "Float!", provider: "ScreenWidth.relayprovider" }
    pixelRatio: { type: "Float!", provider: "PixelRatio.relayprovider" }
    cappedPixelRatio: {
      type: "Float!"
      provider: "CappedPixelRatio.relayprovider"
    }
  ) {
    cardModuleColor {
      background
      content
      graphic
      text
      title
    }
    cardModuleMedias {
      text
      title
      link {
        url
        label
      }
      media {
        id
        ... on MediaImage {
          uri(width: $screenWidth, pixelRatio: $pixelRatio)
          smallThumbnail: uri(width: 125, pixelRatio: $cappedPixelRatio)
        }
        ... on MediaVideo {
          #will be use when we are gonna stop playing a video. still TODO
          uri(width: $screenWidth, pixelRatio: $pixelRatio)
          thumbnail(width: $screenWidth, pixelRatio: $pixelRatio)
          smallThumbnail: thumbnail(
            width: 125 #use for the small preview in toolbox
            pixelRatio: $cappedPixelRatio
          )
        }
      }
    }
  }
`;

export type MediaTextLinkModuleRendererData = NullableFields<
  Omit<
    MediaTextLinkModuleRenderer_module$data,
    ' $fragmentType' | 'cardModuleColor' | 'cardModuleMedias'
  >
> & {
  cardModuleMedias: CardModuleMedia[];
  cardModuleColor: CardModuleColor;
};

export const readMediaTextLinkModuleData = (
  module: MediaTextLinkModuleRenderer_module$key,
) => readInlineData(MediaTextLinkModuleRendererFragment, module);

export type MediaTextLinkModuleRendererProps = CommonModuleRendererProps<
  MediaTextLinkModuleRendererData,
  'mediaTextLink'
>;

const MediaTextLinkModuleRenderer = ({
  data,
  variant,
  scrollPosition,
  displayMode,
  moduleEditing = false,
  ...props
}: MediaTextLinkModuleRendererProps) => {
  if ((data.cardModuleMedias?.length ?? 0) < 1) {
    return null;
  }

  switch (variant) {
    case 'alternation':
      return (
        <CardModuleEditionScrollHandler scrollPosition={scrollPosition}>
          <CardModuleMediaTextLinkAlternation
            cardModuleMedias={data.cardModuleMedias!}
            cardModuleColor={data.cardModuleColor!}
            scrollPosition={scrollPosition}
            displayMode={displayMode}
            moduleEditing={moduleEditing}
            {...props}
          />
        </CardModuleEditionScrollHandler>
      );
    case 'parallax':
      return (
        <CardModuleEditionScrollHandler scrollPosition={scrollPosition}>
          <CardModuleMediaTextLinkParallax
            cardModuleMedias={data.cardModuleMedias!}
            cardModuleColor={data.cardModuleColor!}
            displayMode={displayMode}
            scrollPosition={scrollPosition}
            moduleEditing={moduleEditing}
            {...props}
          />
        </CardModuleEditionScrollHandler>
      );
  }
};

export default withSwapCardModuleColor<
  MediaTextLinkModuleRendererData,
  'mediaTextLink'
>(MediaTextLinkModuleRenderer);
