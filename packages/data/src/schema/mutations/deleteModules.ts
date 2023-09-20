import { inArray } from 'drizzle-orm';
import ERRORS from '@azzapp/shared/errors';
import {
  CardModuleTable,
  db,
  getCardModulesByIds,
  resetCardModulesPositions,
} from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const deleteModules: MutationResolvers['deleteModules'] = async (
  _,
  { input: { modulesIds } },
  { auth, loaders, cardUsernamesToRevalidate },
) => {
  const { profileId } = auth;
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }
  if (modulesIds.length === 0) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  const modules = await getCardModulesByIds(modulesIds);
  if (
    !modules.every(module => module != null && module.profileId === profileId)
  ) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  try {
    await db.transaction(async trx => {
      await db
        .delete(CardModuleTable)
        .where(inArray(CardModuleTable.id, modulesIds));
      await resetCardModulesPositions(profileId, trx);
    });
  } catch (e) {
    console.error(e);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  const profile = (await loaders.Profile.load(profileId))!;
  cardUsernamesToRevalidate.add(profile.userName);

  return { profile };
};

export default deleteModules;
