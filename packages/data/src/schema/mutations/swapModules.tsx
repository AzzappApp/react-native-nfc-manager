import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import { db, getCardModulesByIds, updateCardModule } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const swapModules: MutationResolvers['swapModules'] = async (
  _,
  { input: { moduleAId, moduleBId } },
  { auth, cardByProfileLoader },
) => {
  const profileId = getProfileId(auth);
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }
  const card = await cardByProfileLoader.load(profileId);
  if (!card) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }
  const [moduleA, moduleB] = await getCardModulesByIds([moduleAId, moduleBId]);
  if (
    !moduleA ||
    !moduleB ||
    moduleA.cardId !== card.id ||
    moduleB.cardId !== card.id
  ) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  try {
    await db.transaction().execute(async trx => {
      await updateCardModule(moduleAId, { position: moduleB.position }, trx);
      await updateCardModule(moduleBId, { position: moduleA.position }, trx);
    });
  } catch (e) {
    console.error(e);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { card };
};

export default swapModules;
