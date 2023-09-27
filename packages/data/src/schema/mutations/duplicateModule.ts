import { and, eq, gt, sql } from 'drizzle-orm';
import omit from 'lodash/omit';
import ERRORS from '@azzapp/shared/errors';
import {
  db,
  createCardModule,
  CardModuleTable,
  getCardModulesSortedByPosition,
} from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const duplicateModule: MutationResolvers['duplicateModule'] = async (
  _,
  { input: { moduleIds } },
  { auth, loaders, cardUsernamesToRevalidate },
) => {
  const { profileId } = auth;
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }
  const modules = await getCardModulesSortedByPosition(moduleIds);
  if (modules.some(m => m.profileId !== profileId)) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  const createdModules: Array<{
    originalModuleId: string;
    newModuleId: string;
  }> = [];
  try {
    await db.transaction(async trx => {
      for (const module of modules) {
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
          {
            ...omit(module, 'id'),
            position:
              module.position +
              modules.filter(m => m && m.position < module.position).length +
              1,
          },
          trx,
        );
        createdModules.push({
          originalModuleId: module.id,
          newModuleId,
        });
      }
    });
  } catch (e) {
    console.error(e);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  const profile = (await loaders.Profile.load(profileId))!;
  cardUsernamesToRevalidate.add(profile.userName);

  return { profile, createdModules };
};

export default duplicateModule;
