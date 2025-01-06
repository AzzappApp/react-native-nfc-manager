import { type CardStyle, type ColorPalette } from '@azzapp/shared/cardHelpers';
import {
  HORIZONTAL_PHOTO_DEFAULT_VALUES,
  HORIZONTAL_PHOTO_STYLE_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import MediaModuleRenderer from '#components/cardModules/CardModuleMedia/MediaModuleRenderer';
import { DESKTOP_PREVIEW_WIDTH } from '#components/WebCardPreview';
import useScreenDimensions from '#hooks/useScreenDimensions';
import BlockTextRenderer from './BlockTextRenderer';
import MediaTextModuleRenderer from './CardModuleMediaText/MediaTextModuleRenderer';
import MediaTextLinkModuleRenderer from './CardModuleMediaTextLink/MediaTextLinkModuleRenderer';
import CarouselViewRenderer from './CarouselRenderer';
import HorizontalPhotoRenderer from './HorizontalPhotoRenderer';
import LineDividerRenderer from './LineDividerRenderer';
import PhotoWithTextAndTitleRenderer from './PhotoWithTextAndTitleRenderer';
import SimpleButtonRenderer from './SimpleButtonRenderer';
import { type SimpleButtonRendererData } from './SimpleButtonRenderer';
import SimpleTextRenderer from './SimpleTextRenderer';
import SocialLinksRenderer from './SocialLinksRenderer';
import type { MediaModuleRendererData } from '#components/cardModules/CardModuleMedia/MediaModuleRenderer';
import type { Variant } from '#helpers/webcardModuleHelpers';
import type { BlockTextRendererData } from './BlockTextRenderer';
import type { MediaTextModuleRendererData } from './CardModuleMediaText/MediaTextModuleRenderer';
import type { MediaTextLinkModuleRendererData } from './CardModuleMediaTextLink/MediaTextLinkModuleRenderer';
import type { CarouselRendererData } from './CarouselRenderer';
import type { HorizontalPhotoRendererData } from './HorizontalPhotoRenderer';
import type { LineDividerRendererData } from './LineDividerRenderer';
import type { PhotoWithTextAndTitleRendererData } from './PhotoWithTextAndTitleRenderer';
import type { SimpleTextRendererData } from './SimpleTextRenderer';
import type { SocialLinksRendererData } from './SocialLinksRenderer';
import type {
  MODULE_KIND_BLOCK_TEXT,
  MODULE_KIND_CAROUSEL,
  MODULE_KIND_HORIZONTAL_PHOTO,
  MODULE_KIND_LINE_DIVIDER,
  MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
  MODULE_KIND_SIMPLE_BUTTON,
  MODULE_KIND_SIMPLE_TEXT,
  MODULE_KIND_SIMPLE_TITLE,
  MODULE_KIND_SOCIAL_LINKS,
  MODULE_KIND_MEDIA,
  MODULE_KIND_MEDIA_TEXT,
  MODULE_KIND_MEDIA_TEXT_LINK,
  DisplayMode,
  WebCardViewMode,
} from '@azzapp/shared/cardModuleHelpers';
import type { ViewProps, Animated as RNAnimated } from 'react-native';

export type ModuleRenderInfo =
  | {
      kind: typeof MODULE_KIND_BLOCK_TEXT;
      data: BlockTextRendererData;
      variant: never;
    }
  | {
      kind: typeof MODULE_KIND_CAROUSEL;
      data: CarouselRendererData;
      variant: never;
    }
  | {
      kind: typeof MODULE_KIND_HORIZONTAL_PHOTO;
      data: HorizontalPhotoRendererData;
      variant: never;
    }
  | {
      kind: typeof MODULE_KIND_LINE_DIVIDER;
      data: LineDividerRendererData;
      variant: never;
    }
  | {
      kind: typeof MODULE_KIND_MEDIA_TEXT_LINK;
      data: MediaTextLinkModuleRendererData;
      variant: Variant<'mediaTextLink'>;
    }
  | {
      kind: typeof MODULE_KIND_MEDIA_TEXT;
      data: MediaTextModuleRendererData;
      variant: Variant<'mediaText'>;
    }
  | {
      kind: typeof MODULE_KIND_MEDIA;
      data: MediaModuleRendererData;
      variant: Variant<'media'>;
    }
  | {
      kind: typeof MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE;
      data: PhotoWithTextAndTitleRendererData;
      variant: never;
    }
  | {
      kind: typeof MODULE_KIND_SIMPLE_BUTTON;
      data: SimpleButtonRendererData;
      variant: never;
    }
  | {
      kind: typeof MODULE_KIND_SIMPLE_TEXT;
      data: SimpleTextRendererData;
      variant: never;
    }
  | {
      kind: typeof MODULE_KIND_SIMPLE_TITLE;
      data: SimpleTextRendererData;
      variant: never;
    }
  | {
      kind: typeof MODULE_KIND_SOCIAL_LINKS;
      data: SocialLinksRendererData;
      variant: never;
    };
//#INSERT_MODULES

export type CardModuleRendererProps<T extends ModuleRenderInfo> = ViewProps & {
  /**
   * The module to render
   */
  module: T;
  /**
   * The card style to use
   */
  cardStyle: CardStyle | null | undefined;
  /**
   * The color palette to use
   */
  colorPalette: ColorPalette | null | undefined;
  /**
   * Should the preview be rendered in mobile or desktop mode.
   * @default 'mobile'
   */
  displayMode?: DisplayMode;
  /**
   * Wether the webCard is in edit mode or preview
   */
  webCardViewMode?: WebCardViewMode;
  /**
   * The cover background color
   */
  coverBackgroundColor?: string | null | undefined;
  /**
   * Wether the video of the media are allowed to play
   *
   * @default true
   */
  canPlay?: boolean;

  /**
   * A React Native Animated value that represents the scroll position of the WebCard
   */
  scrollPosition: RNAnimated.Value;

  /**
   * The position of the module in the WebCard
   */
  modulePosition: number;
};

const DESKTOP_CONTENT_MAX_WIDTH = 800;

const CardModuleRenderer = <T extends ModuleRenderInfo>({
  module,
  displayMode = 'mobile',
  scrollPosition,
  modulePosition,
  canPlay = true,
  ...props
}: CardModuleRendererProps<T>) => {
  const { width, height } = useScreenDimensions();
  switch (module.kind) {
    case 'blockText':
      return (
        <BlockTextRenderer
          {...module}
          {...props}
          contentStyle={
            displayMode === 'desktop'
              ? {
                  maxWidth: DESKTOP_CONTENT_MAX_WIDTH,
                  width: '80%',
                  alignSelf: 'center',
                }
              : undefined
          }
        />
      );
    case 'carousel':
      return <CarouselViewRenderer {...module} {...props} />;
    case 'horizontalPhoto': {
      const { marginHorizontal } = getModuleDataValues({
        data: module.data,
        cardStyle: props.cardStyle,
        defaultValues: HORIZONTAL_PHOTO_DEFAULT_VALUES,
        styleValuesMap: HORIZONTAL_PHOTO_STYLE_VALUES,
      });
      return (
        <HorizontalPhotoRenderer
          {...module}
          {...props}
          contentStyle={
            displayMode === 'desktop'
              ? {
                  maxWidth: marginHorizontal
                    ? DESKTOP_CONTENT_MAX_WIDTH
                    : '100%',
                  width: '100%',
                  alignSelf: 'center',
                }
              : undefined
          }
        />
      );
    }
    case 'lineDivider':
      return <LineDividerRenderer {...module} {...props} />;
    case 'photoWithTextAndTitle':
      return (
        <PhotoWithTextAndTitleRenderer
          {...module}
          {...props}
          displayMode={displayMode}
        />
      );
    case 'simpleButton':
      return (
        <SimpleButtonRenderer
          {...module}
          {...props}
          contentStyle={
            displayMode === 'desktop'
              ? {
                  maxWidth: DESKTOP_CONTENT_MAX_WIDTH,
                  alignSelf: 'center',
                }
              : undefined
          }
        />
      );
    case 'simpleText':
      return (
        <SimpleTextRenderer
          {...module}
          {...props}
          contentStyle={
            displayMode === 'desktop'
              ? {
                  maxWidth: DESKTOP_CONTENT_MAX_WIDTH,
                  alignSelf: 'center',
                }
              : undefined
          }
        />
      );

    case 'simpleTitle':
      return (
        <SimpleTextRenderer
          {...module}
          {...props}
          contentStyle={
            displayMode === 'desktop'
              ? {
                  maxWidth: DESKTOP_CONTENT_MAX_WIDTH,
                  alignSelf: 'center',
                }
              : undefined
          }
        />
      );

    case 'socialLinks':
      return (
        <SocialLinksRenderer
          {...module}
          {...props}
          multilineStyle={
            displayMode === 'desktop'
              ? {
                  maxWidth: 800,
                  alignSelf: 'center',
                }
              : undefined
          }
          style={
            displayMode === 'desktop'
              ? [props.style, { alignSelf: 'center' }]
              : props.style
          }
        />
      );
    case 'media':
      return (
        <MediaModuleRenderer
          {...module}
          {...props}
          displayMode={displayMode}
          dimension={{
            width: displayMode === 'desktop' ? DESKTOP_PREVIEW_WIDTH : width,
            height,
          }}
          scrollPosition={scrollPosition}
          modulePosition={modulePosition}
          canPlay={canPlay}
        />
      );
    case 'mediaText':
      return (
        <MediaTextModuleRenderer
          {...module}
          {...props}
          displayMode={displayMode}
          dimension={{
            width: displayMode === 'desktop' ? DESKTOP_PREVIEW_WIDTH : width,
            height,
          }}
          scrollPosition={scrollPosition}
          modulePosition={modulePosition}
          canPlay={canPlay}
        />
      );
    case 'mediaTextLink':
      return (
        <MediaTextLinkModuleRenderer
          {...module}
          {...props}
          displayMode={displayMode}
          dimension={{
            width: displayMode === 'desktop' ? DESKTOP_PREVIEW_WIDTH : width,
            height,
          }}
          scrollPosition={scrollPosition}
          modulePosition={modulePosition}
          canPlay={canPlay}
        />
      );
  }
};
export default CardModuleRenderer;
