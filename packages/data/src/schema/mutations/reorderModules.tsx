import ERRORS from '@azzapp/shared/errors';
import {
  db,
  getCardModulesByIds,
  resetCardModulesPositions,
  updateCardModule,
} from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const reorderModules: MutationResolvers['reorderModules'] = async (
  _,
  { input: { moduleIds } },
  { auth, loaders, cardUpdateListener },
) => {
  const profileId = auth.profileId;
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const profile = await loaders.Profile.load(profileId);
  if (!profile) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }
  const modules = await getCardModulesByIds(moduleIds);
  if (modules.some(module => module?.profileId !== profileId)) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  try {
    await db.transaction(async trx => {
      for (let index = 0; index < moduleIds.length; index++) {
        const moduleId = moduleIds[index];
        await updateCardModule(moduleId, { position: index }, trx);
      }
      await resetCardModulesPositions(profileId, trx);
    });
  } catch (e) {
    console.error(e);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  cardUpdateListener(profile.userName);

  return { profile };
};

export default reorderModules;
