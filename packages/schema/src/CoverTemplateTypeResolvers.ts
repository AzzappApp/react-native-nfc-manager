import {
  getCoverTemplatesByType,
  getCoverTemplatesByTypeAndTag,
} from '@azzapp/data';
import { getLabel, idResolver } from './utils';
import type { CoverTemplateTypeResolvers } from './__generated__/types';

export const CoverTemplateType: CoverTemplateTypeResolvers = {
  id: idResolver('CoverTemplateType'),
  label: async ({ labelKey }, _, context) => {
    console.log({ labelKey });
    const label = await getLabel({ labelKey }, _, context);
    console.log({ label });
    return label;
  },
  coverTemplates: async ({ id }, { tag }) => {
    if (!tag) return getCoverTemplatesByType(id);
    return getCoverTemplatesByTypeAndTag(id, tag);
  },
};
