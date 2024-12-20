import { idResolver } from '#helpers/relayIdHelpers';
import type { CoverPredefinedResolvers } from '#/__generated__/types';

export const CoverPredefined: CoverPredefinedResolvers = {
  id: idResolver('CoverPredefined'),
  media: coverPredefined => {
    return coverPredefined.mediaId;
  },
};
