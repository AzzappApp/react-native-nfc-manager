import { getLabel, idResolver } from './utils';
import type { CoverTemplateTypeResolvers } from './__generated__/types';

export const CoverTemplateType: CoverTemplateTypeResolvers = {
  id: idResolver('CoverTemplateType'),
  label: getLabel,
};
