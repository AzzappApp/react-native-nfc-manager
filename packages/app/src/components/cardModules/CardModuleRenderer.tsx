import { View } from 'react-native';
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
import BlockTextRenderer, { readBlockTextData } from './BlockTextRenderer';
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
import {
  type SimpleButtonRendererProps,
  type SimpleButtonRendererData,
} from './SimpleButtonRenderer';
import SimpleTextRenderer, {
  readSimpleTextData,
  readSimpleTitleData,
} from './SimpleTextRenderer';
import SocialLinksRenderer, {
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
  BlockTextRendererProps,
} from './BlockTextRenderer';
import type { CarouselRendererData } from './CarouselRenderer';
import type {
  HorizontalPhotoRendererData,
  HorizontalPhotoRendererProps,
} from './HorizontalPhotoRenderer';
import type { LineDividerRendererData } from './LineDividerRenderer';
import type {
  PhotoWithTextAndTitleRendererData,
  PhotoWithTextAndTitleRendererProps,
} from './PhotoWithTextAndTitleRenderer';
import type {
  SimpleTextRendererData,
  SimpleTextRendererProps,
} from './SimpleTextRenderer';
import type {
  SocialLinksRendererData,
  SocialLinksRendererProps,
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
      data: SimpleButtonRendererData;
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
  return <Renderer data={module.data as any} {...props} animatedData={null} />;
};
export default CardModuleRenderer;

const MODULE_RENDERERS = {
  [MODULE_KIND_BLOCK_TEXT]: BlockTextRenderer,
  [MODULE_KIND_CAROUSEL]: CarouselViewRenderer,
  [MODULE_KIND_HORIZONTAL_PHOTO]: HorizontalPhotoRenderer,
  [MODULE_KIND_LINE_DIVIDER]: LineDividerRenderer,
  [MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE]: PhotoWithTextAndTitleRenderer,
  [MODULE_KIND_SIMPLE_BUTTON]: SimpleButtonRenderer,
  [MODULE_KIND_SIMPLE_TEXT]: SimpleTextRenderer,
  [MODULE_KIND_SIMPLE_TITLE]: SimpleTextRenderer,
  [MODULE_KIND_SOCIAL_LINKS]: SocialLinksRenderer,
} as const;

const MODULE_RENDERERS_DESKTOP = {
  [MODULE_KIND_BLOCK_TEXT]: (props: BlockTextRendererProps) => (
    <BlockTextRenderer
      {...props}
      contentStyle={{
        maxWidth: DESKTOP_CONTENT_MAX_WIDTH,
        width: '80%',
        alignSelf: 'center',
      }}
    />
  ),
  [MODULE_KIND_CAROUSEL]: CarouselViewRenderer,
  [MODULE_KIND_HORIZONTAL_PHOTO]: (
    props: HorizontalPhotoRendererProps & { animatedData: null },
  ) => {
    const { marginHorizontal } = getModuleDataValues({
      data: props.data,
      cardStyle: props.cardStyle,
      defaultValues: HORIZONTAL_PHOTO_DEFAULT_VALUES,
      styleValuesMap: HORIZONTAL_PHOTO_STYLE_VALUES,
    });

    return (
      <HorizontalPhotoRenderer
        {...props}
        contentStyle={{
          maxWidth: marginHorizontal ? DESKTOP_CONTENT_MAX_WIDTH : '100%',
          width: '100%',
          alignSelf: 'center',
        }}
      />
    );
  },
  [MODULE_KIND_LINE_DIVIDER]: LineDividerRenderer,
  [MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE]: (
    props: PhotoWithTextAndTitleRendererProps,
  ) => <PhotoWithTextAndTitleRenderer {...props} viewMode="desktop" />,
  [MODULE_KIND_SIMPLE_BUTTON]: (props: SimpleButtonRendererProps) => (
    <SimpleButtonRenderer
      {...props}
      contentStyle={{
        maxWidth: DESKTOP_CONTENT_MAX_WIDTH,
        alignSelf: 'center',
      }}
    />
  ),
  [MODULE_KIND_SIMPLE_TEXT]: (props: SimpleTextRendererProps) => (
    <SimpleTextRenderer
      {...props}
      contentStyle={{
        maxWidth: DESKTOP_CONTENT_MAX_WIDTH,
        alignSelf: 'center',
      }}
    />
  ),
  [MODULE_KIND_SIMPLE_TITLE]: (props: SimpleTextRendererProps) => {
    return (
      <View
        style={{
          width: '100%',
          maxWidth: DESKTOP_CONTENT_MAX_WIDTH,
          alignSelf: 'center',
        }}
      >
        <SimpleTextRenderer {...props} />
      </View>
    );
  },
  [MODULE_KIND_SOCIAL_LINKS]: (props: SocialLinksRendererProps) => (
    <SocialLinksRenderer
      {...props}
      multilineStyle={{
        maxWidth: 800,
        alignSelf: 'center',
      }}
    />
  ),
} as const;

const DESKTOP_CONTENT_MAX_WIDTH = 800;
