import { sql, and, gt, eq, notInArray } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import omit from 'lodash/omit';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import {
  db,
  getCardModulesSortedByPosition,
  createCardModules,
  CardModuleTable,
} from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const duplicateModule: MutationResolvers['duplicateModule'] = async (
  _,
  { input: { moduleIds } },
  { auth, cardUsernamesToRevalidate, loaders },
) => {
  const { profileId } = auth;
  if (!profileId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const profile = await loaders.Profile.load(profileId);

  if (!profile || !isEditor(profile.profileRole)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const modules = await getCardModulesSortedByPosition(moduleIds);
  if (modules.some(m => m.webCardId !== profile.webCardId)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  let createdModuleIds: string[] = [];
  if (modules.length) {
    try {
      await db.transaction(async trx => {
        createdModuleIds = await createCardModules(
          modules.map(
            (module, index) => ({
              ...omit(module, 'id'),
              position: modules[modules.length - 1].position + index + 1,
            }),
            trx,
          ),
        );

        await trx
          .update(CardModuleTable)
          .set({
            position: sql`${CardModuleTable.position} + ${modules.length}`,
          })
          .where(
            and(
              gt(
                CardModuleTable.position,
                modules[modules.length - 1].position,
              ),
              eq(CardModuleTable.webCardId, profile.webCardId),
              notInArray(CardModuleTable.id, createdModuleIds),
            ),
          );
      });
    } catch (e) {
      console.error(e);
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }
  }

  if (!profile) throw new Error(ERRORS.INTERNAL_SERVER_ERROR);

  const webCard = await loaders.WebCard.load(profile.webCardId);

  if (webCard) {
    cardUsernamesToRevalidate.add(webCard.userName);
  }

  return {
    createdModules: modules.map((module, index) => ({
      originalModuleId: module.id,
      newModuleId: createdModuleIds[index],
    })),
  };
};

export default duplicateModule;
