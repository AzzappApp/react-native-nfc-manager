import {
  MODULE_KIND_BLOCK_TEXT,
  MODULE_KIND_CAROUSEL,
  MODULE_KIND_HORIZONTAL_PHOTO,
  MODULE_KIND_LINE_DIVIDER,
  MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
  MODULE_KIND_SIMPLE_BUTTON,
  MODULE_KIND_SIMPLE_TEXT,
  MODULE_KIND_SIMPLE_TITLE,
  MODULE_KIND_SOCIAL_LINKS,
} from '@azzapp/shared/cardModuleHelpers';
import BlockTextRenderer, { readBlockTextData } from './BlockTextRenderer';
import CarouselRenderer from './CarouselRenderer';
import { readCarouselData } from './CarouselRenderer/CarouselRenderer';
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
import SimpleTextRenderer, {
  readSimpleTextData,
  readSimpleTitleData,
} from './SimpleTextRenderer';
import SocialLinksRenderer, {
  readSocialLinksData,
} from './SocialLinksRenderer';
import type { BlockTextRendererData } from './BlockTextRenderer';
import type { CarouselRendererData } from './CarouselRenderer';
import type { HorizontalPhotoRendererData } from './HorizontalPhotoRenderer';
import type { LineDividerRendererData } from './LineDividerRenderer';
import type { PhotoWithTextAndTitleRendererData } from './PhotoWithTextAndTitleRenderer';
import type { SimpleButtonRendererData } from './SimpleButtonRenderer';
import type { SimpleTextRendererData } from './SimpleTextRenderer';
import type { SocialLinksRendererData } from './SocialLinksRenderer';
import type { BlockTextRenderer_module$key } from '@azzapp/relay/artifacts/BlockTextRenderer_module.graphql';
import type { CarouselRenderer_module$key } from '@azzapp/relay/artifacts/CarouselRenderer_module.graphql';
import type { HorizontalPhotoRenderer_module$key } from '@azzapp/relay/artifacts/HorizontalPhotoRenderer_module.graphql';
import type { LineDividerRenderer_module$key } from '@azzapp/relay/artifacts/LineDividerRenderer_module.graphql';
import type { PhotoWithTextAndTitleRenderer_module$key } from '@azzapp/relay/artifacts/PhotoWithTextAndTitleRenderer_module.graphql';
import type { SimpleButtonRenderer_module$key } from '@azzapp/relay/artifacts/SimpleButtonRenderer_module.graphql';
import type { SimpleTextRenderer_simpleTextModule$key } from '@azzapp/relay/artifacts/SimpleTextRenderer_simpleTextModule.graphql';
import type { SimpleTextRenderer_simpleTitleModule$key } from '@azzapp/relay/artifacts/SimpleTextRenderer_simpleTitleModule.graphql';
import type { SocialLinksRenderer_module$key } from '@azzapp/relay/artifacts/SocialLinksRenderer_module.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
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

type CardModuleRendererProps<T extends ModuleRenderInfo> = ViewProps & {
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
};

const CardModuleRenderer = <T extends ModuleRenderInfo>({
  module,
  ...props
}: CardModuleRendererProps<T>) => {
  if (!(module.kind in MODULE_RENDERERS)) {
    return null;
  }
  const Renderer = MODULE_RENDERERS[module.kind];
  return <Renderer data={module.data as any} {...props} />;
};
export default CardModuleRenderer;

const MODULE_RENDERERS = {
  [MODULE_KIND_BLOCK_TEXT]: BlockTextRenderer,
  [MODULE_KIND_CAROUSEL]: CarouselRenderer,
  [MODULE_KIND_HORIZONTAL_PHOTO]: HorizontalPhotoRenderer,
  [MODULE_KIND_LINE_DIVIDER]: LineDividerRenderer,
  [MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE]: PhotoWithTextAndTitleRenderer,
  [MODULE_KIND_SIMPLE_BUTTON]: SimpleButtonRenderer,
  [MODULE_KIND_SIMPLE_TEXT]: SimpleTextRenderer,
  [MODULE_KIND_SIMPLE_TITLE]: SimpleTextRenderer,
  [MODULE_KIND_SOCIAL_LINKS]: SocialLinksRenderer,
} as const;
