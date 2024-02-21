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
} from '@azzapp/shared/cardModuleHelpers';
import { BlockTextViewRenderer, readBlockTextData } from './BlockTextRenderer';
import {
  CarouselViewRenderer,
  readCarouselData,
} from './CarouselRenderer/CarouselRenderer';
import {
  HorizontalPhotoViewRenderer,
  readHorizontalPhotoData,
} from './HorizontalPhotoRenderer';
import {
  LineDividerViewRenderer,
  readLineDividerData,
} from './LineDividerRenderer';
import {
  PhotoWithTextAndTitleViewRenderer,
  readPhotoWithTextAndTitleData,
} from './PhotoWithTextAndTitleRenderer';
import {
  SimpleButtonViewRenderer,
  readSimpleButtonData,
} from './SimpleButtonRenderer';
import {
  type SimpleButtonViewRenderProps,
  type SimpleButtonViewRendererData,
} from './SimpleButtonRenderer';
import {
  SimpleTextViewRenderer,
  readSimpleTextData,
  readSimpleTitleData,
} from './SimpleTextRenderer';
import {
  SocialLinksViewRenderer,
  readSocialLinksData,
} from './SocialLinksRenderer';
import type { BlockTextRenderer_module$key } from '#relayArtifacts/BlockTextRenderer_module.graphql';
import type { CarouselRenderer_module$key } from '#relayArtifacts/CarouselRenderer_module.graphql';
import type { HorizontalPhotoRenderer_module$key } from '#relayArtifacts/HorizontalPhotoRenderer_module.graphql';
import type { LineDividerRenderer_module$key } from '#relayArtifacts/LineDividerRenderer_module.graphql';
import type { PhotoWithTextAndTitleRenderer_module$key } from '#relayArtifacts/PhotoWithTextAndTitleRenderer_module.graphql';
import type { SimpleButtonRenderer_module$key } from '#relayArtifacts/SimpleButtonRenderer_module.graphql';
import type { SimpleTextRenderer_simpleTextModule$key } from '#relayArtifacts/SimpleTextRenderer_simpleTextModule.graphql';
import type { SimpleTextRenderer_simpleTitleModule$key } from '#relayArtifacts/SimpleTextRenderer_simpleTitleModule.graphql';
import type { SocialLinksRenderer_module$key } from '#relayArtifacts/SocialLinksRenderer_module.graphql';
import type {
  BlockTextRendererData,
  BlockTextViewRendererProps,
} from './BlockTextRenderer';
import type { CarouselRendererData } from './CarouselRenderer';
import type {
  HorizontalPhotoRendererData,
  HorizontalPhotoViewRendererProps,
} from './HorizontalPhotoRenderer';
import type { LineDividerRendererData } from './LineDividerRenderer';
import type {
  PhotoWithTextAndTitleRendererData,
  PhotoWithTextAndTitleViewRendererProps,
} from './PhotoWithTextAndTitleRenderer';
import type {
  SimpleTextRendererData,
  SimpleTextViewRendererProps,
} from './SimpleTextRenderer';
import type {
  SocialLinksRendererData,
  SocialLinksViewRendererProps,
} from './SocialLinksRenderer';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

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
  }
};

export type ModuleRenderInfo =
  | {
      kind: typeof MODULE_KIND_BLOCK_TEXT;
      data: BlockTextRendererData;
    }
  | {
      kind: typeof MODULE_KIND_CAROUSEL;
      data: CarouselRendererData;
    }
  | {
      kind: typeof MODULE_KIND_HORIZONTAL_PHOTO;
      data: HorizontalPhotoRendererData;
    }
  | {
      kind: typeof MODULE_KIND_LINE_DIVIDER;
      data: LineDividerRendererData;
    }
  | {
      kind: typeof MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE;
      data: PhotoWithTextAndTitleRendererData;
    }
  | {
      kind: typeof MODULE_KIND_SIMPLE_BUTTON;
      data: SimpleButtonViewRendererData;
    }
  | {
      kind: typeof MODULE_KIND_SIMPLE_TEXT;
      data: SimpleTextRendererData;
    }
  | {
      kind: typeof MODULE_KIND_SIMPLE_TITLE;
      data: SimpleTextRendererData;
    }
  | {
      kind: typeof MODULE_KIND_SOCIAL_LINKS;
      data: SocialLinksRendererData;
    };

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
};

const CardModuleRenderer = <T extends ModuleRenderInfo>({
  module,
  viewMode = 'mobile',
  ...props
}: CardModuleRendererProps<T>) => {
  if (!(module.kind in MODULE_RENDERERS)) {
    return null;
  }
  const renderers =
    viewMode === 'mobile' ? MODULE_RENDERERS : MODULE_RENDERERS_DESKTOP;

  const Renderer = renderers[module.kind];
  return <Renderer data={module.data as any} {...props} />;
};
export default CardModuleRenderer;

const MODULE_RENDERERS = {
  [MODULE_KIND_BLOCK_TEXT]: BlockTextViewRenderer,
  [MODULE_KIND_CAROUSEL]: CarouselViewRenderer,
  [MODULE_KIND_HORIZONTAL_PHOTO]: HorizontalPhotoViewRenderer,
  [MODULE_KIND_LINE_DIVIDER]: LineDividerViewRenderer,
  [MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE]: PhotoWithTextAndTitleViewRenderer,
  [MODULE_KIND_SIMPLE_BUTTON]: SimpleButtonViewRenderer,
  [MODULE_KIND_SIMPLE_TEXT]: SimpleTextViewRenderer,
  [MODULE_KIND_SIMPLE_TITLE]: SimpleTextViewRenderer,
  [MODULE_KIND_SOCIAL_LINKS]: SocialLinksViewRenderer,
} as const;

const MODULE_RENDERERS_DESKTOP = {
  [MODULE_KIND_BLOCK_TEXT]: (props: BlockTextViewRendererProps) => (
    <BlockTextViewRenderer
      {...props}
      contentStyle={{
        maxWidth: DESKTOP_CONTENT_MAX_WIDTH,
        width: '80%',
        alignSelf: 'center',
      }}
    />
  ),
  [MODULE_KIND_CAROUSEL]: CarouselViewRenderer,
  [MODULE_KIND_HORIZONTAL_PHOTO]: (props: HorizontalPhotoViewRendererProps) => {
    const { marginHorizontal } = getModuleDataValues({
      data: props.data,
      cardStyle: props.cardStyle,
      defaultValues: HORIZONTAL_PHOTO_DEFAULT_VALUES,
      styleValuesMap: HORIZONTAL_PHOTO_STYLE_VALUES,
    });

    return (
      <HorizontalPhotoViewRenderer
        {...props}
        contentStyle={{
          maxWidth: marginHorizontal ? DESKTOP_CONTENT_MAX_WIDTH : '100%',
          width: '100%',
          alignSelf: 'center',
        }}
      />
    );
  },
  [MODULE_KIND_LINE_DIVIDER]: LineDividerViewRenderer,
  [MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE]: (
    props: PhotoWithTextAndTitleViewRendererProps,
  ) => <PhotoWithTextAndTitleViewRenderer {...props} viewMode="desktop" />,
  [MODULE_KIND_SIMPLE_BUTTON]: (props: SimpleButtonViewRenderProps) => (
    <SimpleButtonViewRenderer
      {...props}
      contentStyle={{
        maxWidth: DESKTOP_CONTENT_MAX_WIDTH,
        alignSelf: 'center',
      }}
    />
  ),
  [MODULE_KIND_SIMPLE_TEXT]: (props: SimpleTextViewRendererProps) => (
    <SimpleTextViewRenderer
      {...props}
      contentStyle={{
        maxWidth: DESKTOP_CONTENT_MAX_WIDTH,
        alignSelf: 'center',
      }}
    />
  ),
  [MODULE_KIND_SIMPLE_TITLE]: (props: SimpleTextViewRendererProps) => (
    <SimpleTextViewRenderer
      {...props}
      contentStyle={{
        maxWidth: DESKTOP_CONTENT_MAX_WIDTH,
        alignSelf: 'center',
      }}
    />
  ),
  [MODULE_KIND_SOCIAL_LINKS]: (props: SocialLinksViewRendererProps) => (
    <SocialLinksViewRenderer
      {...props}
      multilineStyle={{
        maxWidth: 800,
        alignSelf: 'center',
      }}
    />
  ),
} as const;

const DESKTOP_CONTENT_MAX_WIDTH = 800;
