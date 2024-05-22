import { idResolver } from './utils';
import type { CoverTemplatePreviewResolvers } from './__generated__/types';

export const CoverTemplatePreview: CoverTemplatePreviewResolvers = {
  id: idResolver('CoverTemplatePreview'),
  media: ({ media }) => ({
    media,
    assetKind: 'cover',
  }),
  coverTemplate: ({ coverTemplateId }, _, { loaders }) =>
    loaders.CoverTemplate.load(coverTemplateId),
};
