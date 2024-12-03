import {
  MODULE_KIND_MEDIA,
  MODULE_KIND_MEDIA_TEXT,
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
