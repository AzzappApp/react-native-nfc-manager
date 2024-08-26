import { labelResolver } from '#helpers/localeHelpers';
import { idResolver } from '#helpers/relayIdHelpers';
import type { CoverTemplateTagResolvers } from '#/__generated__/types';

export const CoverTemplateTag: CoverTemplateTagResolvers = {
  id: idResolver('CoverTemplateTag'),
  label: labelResolver,
};
