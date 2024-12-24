import {
  MODULE_KIND_MAP,
  MODULE_KIND_MEDIA,
  MODULE_KIND_MEDIA_TEXT,
  MODULE_KIND_MEDIA_TEXT_LINK,
  MODULE_KIND_TITLE_TEXT,
} from '@azzapp/shared/cardModuleHelpers';
import type { Route } from '#routes';
import type { ModuleKindWithVariant, Variant } from './webcardModuleHelpers';

export function getRouteForCardModule({
  moduleKind,
  variant,
  moduleId,
  isNew = false,
}: ModuleKindWithVariant & {
  isNew?: boolean;
  moduleId?: string;
}): Route {
  switch (moduleKind) {
    case MODULE_KIND_MEDIA:
      return {
        route: 'CARD_MODULE_MEDIA_EDITION',
        params: {
          moduleId,
          variant: variant as Variant<typeof MODULE_KIND_MEDIA>,
        },
      };
    case MODULE_KIND_MEDIA_TEXT:
      return {
        route: 'CARD_MODULE_MEDIA_TEXT_EDITION',
        params: {
          moduleId,
          variant: variant as Variant<typeof MODULE_KIND_MEDIA_TEXT>,
        },
      };
    case MODULE_KIND_MEDIA_TEXT_LINK:
      return {
        route: 'CARD_MODULE_MEDIA_TEXT_LINK_EDITION',
        params: {
          moduleId,
          variant: variant as Variant<typeof MODULE_KIND_MEDIA_TEXT_LINK>,
        },
      };
    case MODULE_KIND_MAP:
    case MODULE_KIND_TITLE_TEXT:
      //this is a hack to avoid returning null of throwing an error, adding coming soon module (not only variant),
      // break lots of control, like in this case throwing an error to be sure this is coded.
      // adding hack just to display coming soon modules is bad
      return {
        route: 'HOME',
      };
    //INSERT_MODULE
    case 'photoWithTextAndTitle':
    case 'socialLinks':
    case 'blockText':
    case 'carousel':
    case 'horizontalPhoto':
    case 'lineDivider':
    case 'simpleButton':
    case 'simpleText':
    case 'simpleTitle':
      return {
        route: 'CARD_MODULE_EDITION',
        params: { module: moduleKind, moduleId, isNew },
      };
    default:
      throw new Error(`Unknown module kind: ${moduleKind}`);
  }
}
