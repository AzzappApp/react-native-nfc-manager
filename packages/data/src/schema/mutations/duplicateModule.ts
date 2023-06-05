import omit from 'lodash/omit';
import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import { db, createCardModule, getCardModulesByIds } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const duplicateModule: MutationResolvers['duplicateModule'] = async (
  _,
  { input: { moduleId } },
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
  const [module] = await getCardModulesByIds([moduleId]);
  if (!module || module.cardId !== card.id) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  let createdModuleId: string | null = null;
  try {
    await db.transaction().execute(async trx => {
      await trx
        .updateTable('CardModule')
        .set(({ bxp }) => ({
          position: bxp('position', '+', 1),
        }))
        .where('position', '>', module.position)
        .where('cardId', '=', card.id)
        .execute();

      const newModule = await createCardModule(
        { ...omit(module, 'id'), position: module.position + 1 },
        trx,
      );
      createdModuleId = newModule.id;
    });
  } catch (e) {
    console.error(e);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
  if (!createdModuleId) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
  return { card, createdModuleId };
};

export default duplicateModule;
