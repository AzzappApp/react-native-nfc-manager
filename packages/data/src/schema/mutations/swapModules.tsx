import ERRORS from '@azzapp/shared/errors';
import { db, getCardModulesByIds, updateCardModule } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const swapModules: MutationResolvers['swapModules'] = async (
  _,
  { input: { moduleAId, moduleBId } },
  { auth, profileLoader, cardUpdateListener },
) => {
  const profileId = auth.profileId;
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const profile = await profileLoader.load(profileId);
  if (!profile) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }
  const [moduleA, moduleB] = await getCardModulesByIds([moduleAId, moduleBId]);
  if (
    !moduleA ||
    !moduleB ||
    moduleA.profileId !== profileId ||
    moduleB.profileId !== profileId
  ) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  try {
    await db.transaction(async trx => {
      await updateCardModule(moduleAId, { position: moduleB.position }, trx);
      await updateCardModule(moduleBId, { position: moduleA.position }, trx);
    });
  } catch (e) {
    console.error(e);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  cardUpdateListener(profile.userName);

  return { profile };
};

export default swapModules;
