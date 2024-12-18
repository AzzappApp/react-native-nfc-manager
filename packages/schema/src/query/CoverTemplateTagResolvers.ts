import { TEMPLATE_COVERTAG_DESCRIPTION_PREFIX } from '@azzapp/shared/translationsContants';
import { labelResolver, labelResolverWithPrefix } from '#helpers/localeHelpers';
import { idResolver } from '#helpers/relayIdHelpers';
import type { CoverTemplateTagResolvers } from '#/__generated__/types';

export const CoverTemplateTag: CoverTemplateTagResolvers = {
  id: idResolver('CoverTemplateTag'),
  label: labelResolver,
  description: labelResolverWithPrefix(TEMPLATE_COVERTAG_DESCRIPTION_PREFIX),
};
