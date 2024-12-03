import { useMemo } from 'react';
import { graphql, readInlineData } from 'react-relay';
import {
  swapModuleColor,
  type CardModuleColor,
} from '@azzapp/shared/cardModuleHelpers';
import CardModuleEditionScrollHandler from '../CardModuleEditionScrollHandler';
import CardModuleMediaTextAlternation from './CardModuleMediaTextAlternation';
import CardModuleMediaTextParallax from './CardModuleMediaTextParallax';
import type {
  MediaTextModuleRenderer_module$data,
  MediaTextModuleRenderer_module$key,
} from '#relayArtifacts/MediaTextModuleRenderer_module.graphql';
import type {
  CardModuleMedia,
  CommonModuleRendererProps,
} from '../cardModuleEditorType';
import type { NullableFields } from '@azzapp/shared/objectHelpers';

/**
 * Render a SimpleButton module
 */
export const MediaTextModuleRendererFragment = graphql`
  fragment MediaTextModuleRenderer_module on CardModuleMediaText
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
      media {
        id
        uri(width: $screenWidth, pixelRatio: $pixelRatio)
        ... on MediaVideo {
          #will be use when we are gonna stop playing a video. still TODO
          thumbnail(width: $screenWidth, pixelRatio: $pixelRatio)
          smallThumbnail: thumbnail(
            width: 66 #use for the small preview in toolbox
            pixelRatio: $cappedPixelRatio
          )
        }
      }
    }
  }
`;

export type MediaTextModuleRendererData = NullableFields<
  Omit<
    MediaTextModuleRenderer_module$data,
    ' $fragmentType' | 'cardModuleColor' | 'cardModuleMedias'
  >
> & {
  cardModuleMedias: CardModuleMedia[];
  cardModuleColor: CardModuleColor;
};

export const readMediaTextModuleData = (
  module: MediaTextModuleRenderer_module$key,
) => readInlineData(MediaTextModuleRendererFragment, module);

export type MediaTextModuleRendererProps = CommonModuleRendererProps<
  MediaTextModuleRendererData,
  'mediaText'
>;

const MediaTextModuleRenderer = ({
  data,
  variant,
  scrollPosition,
  disableAnimation,
  colorPalette,
  viewMode,
  ...props
}: MediaTextModuleRendererProps) => {
  const swapedColor = useMemo(
    () => swapModuleColor(data.cardModuleColor, colorPalette),
    [colorPalette, data.cardModuleColor],
  );

  if ((data.cardModuleMedias?.length ?? 0) < 1) {
    return null;
  }

  switch (variant) {
    case 'alternation':
      return (
        <CardModuleEditionScrollHandler>
          <CardModuleMediaTextAlternation
            cardModuleMedias={data.cardModuleMedias!}
            cardModuleColor={swapedColor}
            viewMode={viewMode}
            {...props}
          />
        </CardModuleEditionScrollHandler>
      );
    case 'parallax':
      return (
        <CardModuleEditionScrollHandler scrollPosition={scrollPosition}>
          <CardModuleMediaTextParallax
            cardModuleMedias={data.cardModuleMedias}
            cardModuleColor={swapedColor}
            viewMode={viewMode}
            scrollPosition={scrollPosition}
            disableParallax={disableAnimation}
            {...props}
          />
        </CardModuleEditionScrollHandler>
      );
  }
};

export default MediaTextModuleRenderer;
