import { graphql, useFragment } from 'react-relay';
import {
  MODULE_KIND_BLOCK_TEXT,
  MODULE_KIND_CAROUSEL,
  MODULE_KIND_HORIZONTAL_PHOTO,
  MODULE_KIND_LINE_DIVIDER,
  MODULE_KIND_MEDIA,
  MODULE_KIND_MEDIA_TEXT,
  MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
  MODULE_KIND_SIMPLE_BUTTON,
  MODULE_KIND_SIMPLE_TEXT,
  MODULE_KIND_SIMPLE_TITLE,
  MODULE_KIND_SOCIAL_LINKS,
} from '@azzapp/shared/cardModuleHelpers';
import { isDefined } from '@azzapp/shared/isDefined';
import { readMediaModuleData } from '#components/cardModules/CardModuleMedia/MediaModuleRenderer';
import { readBlockTextData } from './BlockTextRenderer';
import { readMediaTextModuleData } from './CardModuleMediaText/MediaTextModuleRenderer';
import { readCarouselData } from './CarouselRenderer/CarouselRenderer';
import { readHorizontalPhotoData } from './HorizontalPhotoRenderer';
import { readLineDividerData } from './LineDividerRenderer';
import { readPhotoWithTextAndTitleData } from './PhotoWithTextAndTitleRenderer';
import { readSimpleButtonData } from './SimpleButtonRenderer';
import { readSimpleTextData, readSimpleTitleData } from './SimpleTextRenderer';
import { readSocialLinksData } from './SocialLinksRenderer';
import type { BlockTextRenderer_module$key } from '#relayArtifacts/BlockTextRenderer_module.graphql';
import type { CarouselRenderer_module$key } from '#relayArtifacts/CarouselRenderer_module.graphql';
import type { HorizontalPhotoRenderer_module$key } from '#relayArtifacts/HorizontalPhotoRenderer_module.graphql';
import type { LineDividerRenderer_module$key } from '#relayArtifacts/LineDividerRenderer_module.graphql';
import type { MediaModuleRenderer_module$key } from '#relayArtifacts/MediaModuleRenderer_module.graphql';
import type { MediaTextModuleRenderer_module$key } from '#relayArtifacts/MediaTextModuleRenderer_module.graphql';
import type { ModuleData_cardModules$key } from '#relayArtifacts/ModuleData_cardModules.graphql';
import type { PhotoWithTextAndTitleRenderer_module$key } from '#relayArtifacts/PhotoWithTextAndTitleRenderer_module.graphql';
import type { SimpleButtonRenderer_module$key } from '#relayArtifacts/SimpleButtonRenderer_module.graphql';
import type { SimpleTextRenderer_simpleTextModule$key } from '#relayArtifacts/SimpleTextRenderer_simpleTextModule.graphql';
import type { SimpleTextRenderer_simpleTitleModule$key } from '#relayArtifacts/SimpleTextRenderer_simpleTitleModule.graphql';
import type { SocialLinksRenderer_module$key } from '#relayArtifacts/SocialLinksRenderer_module.graphql';
import type { ModuleRenderInfo } from './CardModuleRenderer';

export type ModuleReadInfo =
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
//INSERT_MODULE: add more case here

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
    //INSERT_MODULE: add more case here
  }
};

const ModulesDataFragment = graphql`
  fragment ModuleData_cardModules on CardModule @relay(plural: true) {
    id
    kind
    visible
    variant
    ...BlockTextRenderer_module
    ...PhotoWithTextAndTitleRenderer_module
    ...SocialLinksRenderer_module
    ...HorizontalPhotoRenderer_module
    ...SimpleButtonRenderer_module
    ...SimpleTextRenderer_simpleTitleModule
    ...SimpleTextRenderer_simpleTextModule
    ...LineDividerRenderer_module
    ...CarouselRenderer_module
    ...MediaModuleRenderer_module
    ...MediaTextModuleRenderer_module
    #INSERT_MODULE: add more case here
  }
`;

/**
 *  Return the list of modules(can be filter using visible)
 *
 * @param {ModuleData_cardModules$key} cardModulesKey
 * @param {boolean} visible show only Visible module
 * @return {*}
 */
export const useModulesData = (
  cardModulesKey: ModuleData_cardModules$key,
  visible: boolean = false,
) => {
  const modules = useFragment(ModulesDataFragment, cardModulesKey);
  if (!modules) {
    return [];
  }
  return modules
    .map(module => {
      if (module) {
        if (visible && !module.visible) {
          return null;
        }
        return {
          id: module.id,
          kind: module.kind,
          visible: module.visible,
          variant: module.variant,
          data: readModuleData(module as any),
        } as unknown as ModuleRenderInfo & { id: string; visible: boolean };
      }
      return null;
    })
    .filter(isDefined);
};
