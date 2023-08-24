import { graphql, useFragment } from 'react-relay';
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
import { readBlockTextData } from './BlockTextRenderer';
import { readCarouselData } from './CarouselRenderer/CarouselRenderer';
import { readHorizontalPhotoData } from './HorizontalPhotoRenderer';
import { readLineDividerData } from './LineDividerRenderer';
import { readPhotoWithTextAndTitleData } from './PhotoWithTextAndTitleRenderer';
import { readSimpleButtonData } from './SimpleButtonRenderer';
import { readSimpleTextData, readSimpleTitleData } from './SimpleTextRenderer';
import { readSocialLinksData } from './SocialLinksRenderer';
import type { ModuleRenderInfo } from './CardModuleRenderer';
import type { BlockTextRenderer_module$key } from '@azzapp/relay/artifacts/BlockTextRenderer_module.graphql';
import type { CarouselRenderer_module$key } from '@azzapp/relay/artifacts/CarouselRenderer_module.graphql';
import type { HorizontalPhotoRenderer_module$key } from '@azzapp/relay/artifacts/HorizontalPhotoRenderer_module.graphql';
import type { LineDividerRenderer_module$key } from '@azzapp/relay/artifacts/LineDividerRenderer_module.graphql';
import type { ModuleData_cardModules$key } from '@azzapp/relay/artifacts/ModuleData_cardModules.graphql';
import type { PhotoWithTextAndTitleRenderer_module$key } from '@azzapp/relay/artifacts/PhotoWithTextAndTitleRenderer_module.graphql';
import type { SimpleButtonRenderer_module$key } from '@azzapp/relay/artifacts/SimpleButtonRenderer_module.graphql';
import type { SimpleTextRenderer_simpleTextModule$key } from '@azzapp/relay/artifacts/SimpleTextRenderer_simpleTextModule.graphql';
import type { SimpleTextRenderer_simpleTitleModule$key } from '@azzapp/relay/artifacts/SimpleTextRenderer_simpleTitleModule.graphql';
import type { SocialLinksRenderer_module$key } from '@azzapp/relay/artifacts/SocialLinksRenderer_module.graphql';

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

const ModulesDataFragment = graphql`
  fragment ModuleData_cardModules on CardModule @relay(plural: true) {
    id
    kind
    visible
    ...BlockTextRenderer_module
    ...PhotoWithTextAndTitleRenderer_module
    ...SocialLinksRenderer_module
    ...HorizontalPhotoRenderer_module
    ...SimpleButtonRenderer_module
    ...SimpleTextRenderer_simpleTitleModule
    ...SimpleTextRenderer_simpleTextModule
    ...LineDividerRenderer_module
    ...CarouselRenderer_module
  }
`;

export const useModulesData = (cardModulesKey: ModuleData_cardModules$key) => {
  const modules = useFragment(ModulesDataFragment, cardModulesKey);
  return modules.map(
    module =>
      ({
        id: module.id,
        kind: module.kind,
        visible: module.visible,
        data: readModuleData(module as any),
      }) as ModuleRenderInfo & { id: string; visible: boolean },
  );
};
