import { inArray } from 'drizzle-orm';
import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import { CardModuleTable, db, getCardModulesByIds } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const updateModulesVisibility: MutationResolvers['updateModulesVisibility'] =
  async (_source, args, { auth, cardByProfileLoader }) => {
    const { modulesIds, visible } = args.input;

    const profileId = getProfileId(auth);
    if (!profileId) {
      throw new Error(ERRORS.UNAUTORIZED);
    }
    if (modulesIds.length === 0) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    const card = await cardByProfileLoader.load(profileId);
    if (!card) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }
    const modules = await getCardModulesByIds(modulesIds);
    if (!modules.every(module => module != null && module.cardId === card.id)) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    try {
      await db
        .update(CardModuleTable)
        .set({ visible })
        .where(inArray(CardModuleTable.id, modulesIds))
        .execute();
    } catch (e) {
      console.error(e);
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    return { card };
  };

export default updateModulesVisibility;
