import { inArray } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import {
  CardModuleTable,
  db,
  getCardModulesByIds,
  getUserProfileWithWebCardId,
  resetCardModulesPositions,
} from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const deleteModules: MutationResolvers['deleteModules'] = async (
  _,
  { input: { modulesIds } },
  { auth, cardUsernamesToRevalidate, loaders },
) => {
  const { userId } = auth;
  const modules = await getCardModulesByIds(modulesIds);
  if (modulesIds.length === 0) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCardId = modules[0]!.webCardId;
  if (
    !modules.every(module => module != null && module.webCardId === webCardId)
  ) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const profile =
    userId && (await getUserProfileWithWebCardId(userId, webCardId));

  if (!profile || !isEditor(profile.profileRole)) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  try {
    await db.transaction(async trx => {
      await db
        .delete(CardModuleTable)
        .where(inArray(CardModuleTable.id, modulesIds));
      await resetCardModulesPositions(profile.id, trx);
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  const webCard = await loaders.WebCard.load(profile.webCardId);

  if (!webCard) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  cardUsernamesToRevalidate.add(webCard.userName);

  return { webCard };
};

export default deleteModules;
