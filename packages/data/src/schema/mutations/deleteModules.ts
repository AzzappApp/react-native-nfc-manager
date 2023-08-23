import { inArray, sql } from 'drizzle-orm';
import ERRORS from '@azzapp/shared/errors';
import { CardModuleTable, db, getCardModulesByIds } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const deleteModules: MutationResolvers['deleteModules'] = async (
  _,
  { input: { modulesIds } },
  { auth, profileLoader, cardUpdateListener },
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
      await trx
        .delete(CardModuleTable)
        .where(inArray(CardModuleTable.id, modulesIds));

      // TODO : We need to evaluate if this the performance of this query
      // is acceptable. If not, we can always find a better way to
      // manage the position of the modules.
      const updatePosQuery = sql`
        UPDATE CardModule
        JOIN ( 
          SELECT 
            id, 
            ROW_NUMBER() OVER (PARTITION BY profileId ORDER BY position) position
          FROM CardModule
          WHERE profileId = ${profileId}
        ) AS NewPos
        ON CardModule.id = NewPos.id
        SET CardModule.position = NewPos.position - 1
        WHERE CardModule.profileId = ${profileId}
      `;
      await trx.execute(updatePosQuery);
    });
  } catch (e) {
    console.error(e);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  const profile = (await profileLoader.load(profileId))!;
  cardUpdateListener(profile.userName);

  return { profile };
};

export default deleteModules;
