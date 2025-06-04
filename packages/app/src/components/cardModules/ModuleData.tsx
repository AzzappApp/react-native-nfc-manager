import { graphql, useFragment } from 'react-relay';
import { isDefined } from '@azzapp/shared/isDefined';
import { readMediaModuleData } from '#components/cardModules/CardModuleMedia/MediaModuleRenderer';
import { isModuleVariantSupported } from '#helpers/webcardModuleHelpers';
import { readBlockTextData } from './BlockTextRenderer';
import { readMediaTextModuleData } from './CardModuleMediaText/MediaTextModuleRenderer';
import { readMediaTextLinkModuleData } from './CardModuleMediaTextLink/MediaTextLinkModuleRenderer';
import { readTitleTextModuleData } from './CardModuleTitleText/TitleTextModuleRenderer';
import { readCarouselData } from './CarouselRenderer';
import { readHorizontalPhotoData } from './HorizontalPhotoRenderer';
import { readLineDividerData } from './LineDividerRenderer';
import { readPhotoWithTextAndTitleData } from './PhotoWithTextAndTitleRenderer';
import { readSimpleButtonData } from './SimpleButtonRenderer';
import { readSimpleTextData, readSimpleTitleData } from './SimpleTextRenderer';
import { readSocialLinksData } from './SocialLinksRenderer';
import type {
  ModuleData_cardModules$data,
  ModuleData_cardModules$key,
} from '#relayArtifacts/ModuleData_cardModules.graphql';
import type { ModuleRenderInfo } from './CardModuleRenderer';
//INSERT_MODULE: add more case here

export const readModuleData = (module: ModuleData_cardModules$data[0]) => {
  switch (true) {
    case module.blockText != null:
      return readBlockTextData(module.blockText);
    case module.carousel != null:
      return readCarouselData(module.carousel);
    case module.horizontalPhoto != null:
      return readHorizontalPhotoData(module.horizontalPhoto);
    case module.lineDivider != null:
      return readLineDividerData(module.lineDivider);
    case module.photoWithTextAndTitle != null:
      return readPhotoWithTextAndTitleData(module.photoWithTextAndTitle);
    case module.simpleButton != null:
      return readSimpleButtonData(module.simpleButton);
    case module.simpleText != null:
      return readSimpleTextData(module.simpleText);
    case module.simpleTitle != null:
      return readSimpleTitleData(module.simpleTitle);
    case module.socialLinks != null:
      return readSocialLinksData(module.socialLinks);
    case module.media != null:
      return readMediaModuleData(module.media);
    case module.mediaText != null:
      return readMediaTextModuleData(module.mediaText);
    case module.mediaTextLink != null:
      return readMediaTextLinkModuleData(module.mediaTextLink);
    case module.titleText != null:
      return readTitleTextModuleData(module.titleText);
    //INSERT_MODULE: add more case here
  }
};

const ModulesDataFragment = graphql`
  fragment ModuleData_cardModules on CardModule @relay(plural: true) {
    id
    kind
    visible
    variant
    ...BlockTextRenderer_module @alias(as: "blockText")
    ...PhotoWithTextAndTitleRenderer_module @alias(as: "photoWithTextAndTitle")
    ...SocialLinksRenderer_module @alias(as: "socialLinks")
    ...HorizontalPhotoRenderer_module @alias(as: "horizontalPhoto")
    ...SimpleButtonRenderer_module @alias(as: "simpleButton")
    ...SimpleTextRenderer_simpleTitleModule @alias(as: "simpleTitle")
    ...SimpleTextRenderer_simpleTextModule @alias(as: "simpleText")
    ...LineDividerRenderer_module @alias(as: "lineDivider")
    ...CarouselRenderer_module @alias(as: "carousel")
    ...MediaModuleRenderer_module @alias(as: "media")
    ...MediaTextModuleRenderer_module @alias(as: "mediaText")
    ...MediaTextLinkModuleRenderer_module @alias(as: "mediaTextLink")
    ...TitleTextModuleRenderer_module @alias(as: "titleText")
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
        } else if (
          !isModuleVariantSupported({
            moduleKind: module.kind,
            variant: module.variant,
          })
        ) {
          return null;
        }
        return {
          id: module.id,
          kind: module.kind,
          visible: module.visible,
          variant: module.variant,
          data: readModuleData(module),
        } as unknown as ModuleRenderInfo & { id: string; visible: boolean };
      }
      return null;
    })
    .filter(isDefined);
};
