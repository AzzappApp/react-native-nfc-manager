import { type CardStyle, type ColorPalette } from '@azzapp/shared/cardHelpers';
import {
  HORIZONTAL_PHOTO_DEFAULT_VALUES,
  HORIZONTAL_PHOTO_STYLE_VALUES,
  MODULE_KIND_BLOCK_TEXT,
  MODULE_KIND_CAROUSEL,
  MODULE_KIND_HORIZONTAL_PHOTO,
  MODULE_KIND_LINE_DIVIDER,
  MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
  MODULE_KIND_SIMPLE_BUTTON,
  MODULE_KIND_SIMPLE_TEXT,
  MODULE_KIND_SIMPLE_TITLE,
  MODULE_KIND_SOCIAL_LINKS,
  getModuleDataValues,
  MODULE_KIND_MEDIA,
  MODULE_KIND_MEDIA_TEXT,
} from '@azzapp/shared/cardModuleHelpers';
import MediaModuleRenderer, {
  readMediaModuleData,
} from '#components/cardModules/CardModuleMedia/MediaModuleRenderer';
import { DESKTOP_PREVIEW_WIDTH } from '#components/WebCardPreview';
import useScreenDimensions from '#hooks/useScreenDimensions';
import BlockTextRenderer, { readBlockTextData } from './BlockTextRenderer';
import MediaTextModuleRenderer, {
  readMediaTextModuleData,
} from './CardModuleMediaText/MediaTextModuleRenderer';
import {
  CarouselViewRenderer,
  readCarouselData,
} from './CarouselRenderer/CarouselRenderer';
import HorizontalPhotoRenderer, {
  readHorizontalPhotoData,
} from './HorizontalPhotoRenderer';
import LineDividerRenderer, {
  readLineDividerData,
} from './LineDividerRenderer';
import PhotoWithTextAndTitleRenderer, {
  readPhotoWithTextAndTitleData,
} from './PhotoWithTextAndTitleRenderer';
import SimpleButtonRenderer, {
  readSimpleButtonData,
} from './SimpleButtonRenderer';
import { type SimpleButtonRendererData } from './SimpleButtonRenderer';
import SimpleTextRenderer, {
  readSimpleTextData,
  readSimpleTitleData,
} from './SimpleTextRenderer';
import SocialLinksRenderer, {
  readSocialLinksData,
} from './SocialLinksRenderer';
import type { MediaModuleRendererData } from '#components/cardModules/CardModuleMedia/MediaModuleRenderer';
import type { Variant } from '#helpers/webcardModuleHelpers';
import type { BlockTextRenderer_module$key } from '#relayArtifacts/BlockTextRenderer_module.graphql';
import type { CarouselRenderer_module$key } from '#relayArtifacts/CarouselRenderer_module.graphql';
import type { HorizontalPhotoRenderer_module$key } from '#relayArtifacts/HorizontalPhotoRenderer_module.graphql';
import type { LineDividerRenderer_module$key } from '#relayArtifacts/LineDividerRenderer_module.graphql';
import type { MediaModuleRenderer_module$key } from '#relayArtifacts/MediaModuleRenderer_module.graphql';
import type { MediaTextModuleRenderer_module$key } from '#relayArtifacts/MediaTextModuleRenderer_module.graphql';
import type { PhotoWithTextAndTitleRenderer_module$key } from '#relayArtifacts/PhotoWithTextAndTitleRenderer_module.graphql';
import type { SimpleButtonRenderer_module$key } from '#relayArtifacts/SimpleButtonRenderer_module.graphql';
import type { SimpleTextRenderer_simpleTextModule$key } from '#relayArtifacts/SimpleTextRenderer_simpleTextModule.graphql';
import type { SimpleTextRenderer_simpleTitleModule$key } from '#relayArtifacts/SimpleTextRenderer_simpleTitleModule.graphql';
import type { SocialLinksRenderer_module$key } from '#relayArtifacts/SocialLinksRenderer_module.graphql';
import type { BlockTextRendererData } from './BlockTextRenderer';
import type { MediaTextModuleRendererData } from './CardModuleMediaText/MediaTextModuleRenderer';
import type { CarouselViewRendererData } from './CarouselRenderer/CarouselRenderer';
import type { HorizontalPhotoRendererData } from './HorizontalPhotoRenderer';
import type { LineDividerRendererData } from './LineDividerRenderer';
import type { PhotoWithTextAndTitleRendererData } from './PhotoWithTextAndTitleRenderer';
import type { SimpleTextRendererData } from './SimpleTextRenderer';
import type { SocialLinksRendererData } from './SocialLinksRenderer';
import type { ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type ModuleReadInfo =
  | (BlockTextRenderer_module$key & {
      kind: typeof MODULE_KIND_BLOCK_TEXT;
    })
  | (CarouselRenderer_module$key & {
      kind: typeof MODULE_KIND_CAROUSEL;
    })
  | (HorizontalPhotoRenderer_module$key & {
      kind: typeof MODULE_KIND_HORIZONTAL_PHOTO;
    })
  | (LineDividerRenderer_module$key & {
      kind: typeof MODULE_KIND_LINE_DIVIDER;
    })
  | (MediaModuleRenderer_module$key & { kind: typeof MODULE_KIND_MEDIA })
  | (MediaTextModuleRenderer_module$key & {
      kind: typeof MODULE_KIND_MEDIA_TEXT;
    })
  | (PhotoWithTextAndTitleRenderer_module$key & {
      kind: typeof MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE;
    })
  | (SimpleButtonRenderer_module$key & {
      kind: typeof MODULE_KIND_SIMPLE_BUTTON;
    })
  | (SimpleTextRenderer_simpleTextModule$key & {
      kind: typeof MODULE_KIND_SIMPLE_TEXT;
    })
  | (SimpleTextRenderer_simpleTitleModule$key & {
      kind: typeof MODULE_KIND_SIMPLE_TITLE;
    })
  | (SocialLinksRenderer_module$key & {
      kind: typeof MODULE_KIND_SOCIAL_LINKS;
    });

export const readModuleData = (module: ModuleReadInfo) => {
  switch (module.kind) {
    case MODULE_KIND_BLOCK_TEXT:
      return readBlockTextData(module);
    case MODULE_KIND_CAROUSEL:
      return readCarouselData(module);
    case MODULE_KIND_HORIZONTAL_PHOTO:
      return readHorizontalPhotoData(module);
    case MODULE_KIND_LINE_DIVIDER:
      return readLineDividerData(module);
    case MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE:
      return readPhotoWithTextAndTitleData(module);
    case MODULE_KIND_SIMPLE_BUTTON:
      return readSimpleButtonData(module);
    case MODULE_KIND_SIMPLE_TEXT:
      return readSimpleTextData(module);
    case MODULE_KIND_SIMPLE_TITLE:
      return readSimpleTitleData(module);
    case MODULE_KIND_SOCIAL_LINKS:
      return readSocialLinksData(module);
    case MODULE_KIND_MEDIA:
      return readMediaModuleData(module);
    case MODULE_KIND_MEDIA_TEXT:
      return readMediaTextModuleData(module);
  }
};

export type ModuleRenderInfo =
  | {
      kind: typeof MODULE_KIND_BLOCK_TEXT;
      data: BlockTextRendererData;
      variant: never;
    }
  | {
      kind: typeof MODULE_KIND_CAROUSEL;
      data: CarouselViewRendererData;
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
  viewMode?: 'desktop' | 'mobile';
  /**
   * The cover background color
   */
  coverBackgroundColor?: string | null | undefined;

  scrollPosition: SharedValue<number>;

  modulePosition: SharedValue<number>;

  editing?: boolean;
};

const DESKTOP_CONTENT_MAX_WIDTH = 800;

const CardModuleRenderer = <T extends ModuleRenderInfo>({
  module,
  viewMode = 'mobile',
  scrollPosition,
  modulePosition,
  editing,
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
            viewMode === 'desktop'
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
          animatedData={null}
          contentStyle={
            viewMode === 'desktop'
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
      return <LineDividerRenderer {...module} {...props} animatedData={null} />;
    case 'photoWithTextAndTitle':
      return (
        <PhotoWithTextAndTitleRenderer
          {...module}
          {...props}
          animatedData={null}
          viewMode={viewMode}
        />
      );
    case 'simpleButton':
      return (
        <SimpleButtonRenderer
          {...module}
          {...props}
          animatedData={null}
          contentStyle={
            viewMode === 'desktop'
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
          animatedData={null}
          contentStyle={
            viewMode === 'desktop'
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
          animatedData={null}
          contentStyle={
            viewMode === 'desktop'
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
          animatedData={null}
          multilineStyle={
            viewMode === 'desktop'
              ? {
                  maxWidth: 800,
                  alignSelf: 'center',
                }
              : undefined
          }
          style={
            viewMode === 'desktop'
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
          viewMode={viewMode}
          dimension={{
            width: viewMode === 'desktop' ? DESKTOP_PREVIEW_WIDTH : width,
            height: editing ? height / 4 : height,
          }}
          scrollPosition={scrollPosition}
          modulePosition={modulePosition}
          webCardEditing={editing}
          disableAnimation={viewMode === 'desktop' || editing === true}
        />
      );
    case 'mediaText':
      return (
        <MediaTextModuleRenderer
          {...module}
          {...props}
          viewMode={viewMode}
          dimension={{
            width: viewMode === 'desktop' ? DESKTOP_PREVIEW_WIDTH : width,
            height:
              editing && module.variant === 'parallax' ? height / 4 : height,
          }}
          scrollPosition={scrollPosition}
          modulePosition={modulePosition}
          disableAnimation={
            viewMode === 'desktop' ||
            (module.variant === 'parallax' && editing === true)
          }
        />
      );
  }
};
export default CardModuleRenderer;
