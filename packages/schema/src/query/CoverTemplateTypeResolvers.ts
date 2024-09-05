import { labelResolver } from '#helpers/localeHelpers';
import { idResolver } from '#helpers/relayIdHelpers';
import type { CoverTemplateTypeResolvers } from '#/__generated__/types';

export const CoverTemplateType: CoverTemplateTypeResolvers = {
  id: idResolver('CoverTemplateType'),
  label: labelResolver,
};
