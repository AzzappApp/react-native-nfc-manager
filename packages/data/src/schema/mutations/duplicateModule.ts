import { and, eq, gt, sql } from 'drizzle-orm';
import omit from 'lodash/omit';
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
  { auth, loaders, cardUpdateListener },
) => {
  const { profileId } = auth;
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }
  const [module] = await getCardModulesByIds([moduleId]);
  if (!module || module.profileId !== profileId) {
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
            eq(CardModuleTable.profileId, profileId),
          ),
        );

      const newModuleId = await createCardModule(
        { ...omit(module, 'id'), position: module.position + 1 },
        trx,
      );
      createdModuleId = newModuleId;
    });
  } catch (e) {
    console.error(e);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
  if (!createdModuleId) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  const profile = (await loaders.Profile.load(profileId))!;
  cardUpdateListener(profile.userName);

  return { profile, createdModuleId };
};

export default duplicateModule;
