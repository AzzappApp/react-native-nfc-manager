import { sql } from 'kysely';
import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import { db, getCardModulesByIds } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const deleteModules: MutationResolvers['deleteModules'] = async (
  _,
  { input: { modulesIds } },
  { auth, cardByProfileLoader },
) => {
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
    await db.transaction().execute(async trx => {
      await trx
        .deleteFrom('CardModule')
        .where('id', 'in', modulesIds)
        .execute();

      // TODO : We need to evaluate if this the performance of this query
      // is acceptable. If not, we can always find a better way to
      // manage the position of the modules.
      const updatePosQuery = sql`
        UPDATE CardModule
        JOIN ( 
          SELECT 
            id, 
            ROW_NUMBER() OVER (PARTITION BY cardId ORDER BY position) position
          FROM CardModule
          WHERE cardId = ${card.id}
        ) AS NewPos
        ON CardModule.id = NewPos.id
        SET CardModule.position = NewPos.position - 1
        WHERE CardModule.cardId = ${card.id}
      `;
      await trx.executeQuery(updatePosQuery.compile(trx));
    });
  } catch (e) {
    console.error(e);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
  return { card };
};

export default deleteModules;
