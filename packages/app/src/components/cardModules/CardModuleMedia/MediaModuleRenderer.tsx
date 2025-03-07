import { graphql, readInlineData } from 'react-relay';
import { type CardModuleColor } from '@azzapp/shared/cardModuleHelpers';
import CardModuleEditionScrollHandler from '../CardModuleEditionScrollHandler';
import withSwapCardModuleColor from '../withSwapCardModuleColor';
import CardModuleMediaGrid from './CardModuleMediaGrid';
import CardModuleMediaParallax from './CardModuleMediaParallax';
import CardModuleMediaSlideshow from './CardModuleMediaSlideshow';
import type {
  MediaModuleRenderer_module$key,
  MediaModuleRenderer_module$data,
} from '#relayArtifacts/MediaModuleRenderer_module.graphql';
import type {
  CardModuleMedia,
  CommonModuleRendererProps,
} from '../cardModuleEditorType';
import type { NullableFields } from '@azzapp/shared/objectHelpers';

//TODO: check if we need to duplicated this from MediaModuleWebCardEditionScreen jsut because onf the @inline
// this was duplicate in all V1 module (custom)
export const MediaModuleRendererFragment = graphql`
  fragment MediaModuleRenderer_module on CardModuleMedia
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
      media {
        id
        width
        height
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

export type MediaModuleRendererData = NullableFields<
  Omit<
    MediaModuleRenderer_module$data,
    ' $fragmentType' | 'cardModuleColor' | 'cardModuleMedias'
  >
> & {
  cardModuleMedias: CardModuleMedia[];
  cardModuleColor: CardModuleColor;
};

export const readMediaModuleData = (module: MediaModuleRenderer_module$key) =>
  readInlineData(MediaModuleRendererFragment, module);

export type MediaModuleRendererProps = CommonModuleRendererProps<
  MediaModuleRendererData,
  'media'
>;

const MediaModuleRenderer = ({
  data,
  displayMode = 'mobile',
  variant,
  scrollPosition,
  onLayout,
  colorPalette,
  webCardViewMode,
  moduleEditing = false,
  ...props
}: MediaModuleRendererProps) => {
  if ((data?.cardModuleMedias?.length ?? 0) < 1) {
    return null;
  }

  switch (variant) {
    case 'slideshow':
      return (
        <CardModuleMediaSlideshow
          cardModuleMedias={data.cardModuleMedias}
          cardModuleColor={data.cardModuleColor}
          displayMode={displayMode}
          cancelAutoPlay={webCardViewMode === 'edit'}
          moduleEditing={moduleEditing}
          {...props}
        />
      );
    case 'parallax':
      return (
        <CardModuleEditionScrollHandler scrollPosition={scrollPosition}>
          <CardModuleMediaParallax
            cardModuleMedias={data.cardModuleMedias}
            cardModuleColor={data.cardModuleColor}
            onLayout={onLayout}
            displayMode={displayMode}
            scrollPosition={scrollPosition}
            moduleEditing={moduleEditing}
            webCardViewMode={webCardViewMode}
            {...props}
          />
        </CardModuleEditionScrollHandler>
      );
    case 'original':
    case 'grid':
    case 'square_grid':
    case 'grid2':
    case 'square_grid2':
      return (
        <CardModuleEditionScrollHandler scrollPosition={scrollPosition}>
          <CardModuleMediaGrid
            cardModuleMedias={data.cardModuleMedias}
            cardModuleColor={data.cardModuleColor}
            onLayout={onLayout}
            displayMode={displayMode}
            scrollPosition={scrollPosition}
            square={isSquareGrid(variant)}
            nbColumns={getGridNumberColumn(variant)}
            moduleEditing={moduleEditing}
            webCardViewMode={webCardViewMode}
            {...props}
          />
        </CardModuleEditionScrollHandler>
      );
  }
};

export default withSwapCardModuleColor<MediaModuleRendererData, 'media'>(
  MediaModuleRenderer,
);
const getGridNumberColumn = (variant: string) => {
  switch (variant) {
    case 'grid':
    case 'square_grid':
      return 3;
    case 'grid2':
    case 'square_grid2':
      return 2;
    default:
      return 1;
  }
};

const isSquareGrid = (variant: string) => {
  if (variant === 'square_grid' || variant === 'square_grid2') {
    return true;
  }
  return false;
};
