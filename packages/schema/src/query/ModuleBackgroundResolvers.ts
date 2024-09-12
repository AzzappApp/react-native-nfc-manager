import { getCloudinaryAssetURL } from '@azzapp/shared/imagesHelpers';
import type { ModuleBackgroundResolvers } from '#__generated__/types';

export const ModuleBackground: ModuleBackgroundResolvers = {
  uri: moduleBackground => getCloudinaryAssetURL(moduleBackground.id, 'image'),
  resizeMode: async moduleBackground => moduleBackground.resizeMode ?? 'cover',
};
