import { getLabel, idResolver } from './utils';
import type { CoverTemplateTagResolvers } from './__generated__/types';

export const CoverTemplateTag: CoverTemplateTagResolvers = {
  id: idResolver('CoverTemplateTag'),
  label: getLabel,
};
