import { inArray } from 'drizzle-orm';
import ERRORS from '@azzapp/shared/errors';
import { CardModuleTable, db, getCardModulesByIds } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const updateModulesVisibility: MutationResolvers['updateModulesVisibility'] =
  async (_source, args, { auth, loaders, cardUsernamesToRevalidate }) => {
    const profileId = auth.profileId;
    if (!profileId) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    const profile = await loaders.Profile.load(profileId);
    if (!profile) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }
    const { modulesIds, visible } = args.input;
    if (modulesIds.length === 0) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }
    const modules = await getCardModulesByIds(modulesIds);
    if (
      modules.some(module => module == null || module.profileId !== profileId)
    ) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    try {
      await db
        .update(CardModuleTable)
        .set({ visible })
        .where(inArray(CardModuleTable.id, modulesIds));
    } catch (e) {
      console.error(e);
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }

    cardUsernamesToRevalidate.add(profile.userName);

    return { profile };
  };

export default updateModulesVisibility;
