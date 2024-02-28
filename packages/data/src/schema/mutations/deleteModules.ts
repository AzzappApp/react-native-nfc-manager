import { inArray } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import {
  CardModuleTable,
  db,
  getCardModulesByIds,
  resetCardModulesPositions,
} from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const deleteModules: MutationResolvers['deleteModules'] = async (
  _,
  { webCardId: gqlWebCardId, input: { modulesIds } },
  { cardUsernamesToRevalidate, loaders },
) => {
  const modules = await getCardModulesByIds(modulesIds);
  if (modulesIds.length === 0) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  if (
    !modules.every(module => module != null && module.webCardId === webCardId)
  ) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  try {
    await db.transaction(async trx => {
      await db
        .delete(CardModuleTable)
        .where(inArray(CardModuleTable.id, modulesIds));
      await resetCardModulesPositions(webCardId, trx);
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  const webCard = await loaders.WebCard.load(webCardId);

  if (!webCard) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  cardUsernamesToRevalidate.add(webCard.userName);

  return { webCard };
};

export default deleteModules;
