import { and, eq, gt, sql } from 'drizzle-orm';
import omit from 'lodash/omit';
import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import {
  db,
  createCardModule,
  getCardModulesByIds,
  CardModuleTable,
} from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const duplicateModule: MutationResolvers['duplicateModule'] = async (
  _,
  { input: { moduleId } },
  { auth, cardByProfileLoader, profileLoader, cardUpdateListener },
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
    await db.transaction(async trx => {
      await trx
        .update(CardModuleTable)
        .set({
          position: sql`${CardModuleTable.position} + 1`,
        })
        .where(
          and(
            gt(CardModuleTable.position, module.position),
            eq(CardModuleTable.cardId, card.id),
          ),
        );

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

  const profile = await profileLoader.load(profileId);
  cardUpdateListener(profile!.userName);

  return { card, createdModuleId };
};

export default duplicateModule;
