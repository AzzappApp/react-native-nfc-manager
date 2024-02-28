import { inArray } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { CardModuleTable, db, getCardModulesByIds } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const updateModulesVisibility: MutationResolvers['updateModulesVisibility'] =
  async (
    _source,
    { webCardId: gqlWebCardId, input: { modulesIds, visible } },
    { cardUsernamesToRevalidate, loaders },
  ) => {
    const modules = await getCardModulesByIds(modulesIds);
    if (modulesIds.length === 0) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    const webCardId = fromGlobalId(gqlWebCardId).id;
    if (
      !modules.every(module => module != null && module.webCardId === webCardId)
    ) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    try {
      await db
        .update(CardModuleTable)
        .set({ visible })
        .where(inArray(CardModuleTable.id, modulesIds));
    } catch (e) {
      console.error(e);
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }

    const webCard = await loaders.WebCard.load(webCardId);
    if (!webCard) {
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }

    cardUsernamesToRevalidate.add(webCard.userName);

    return { webCard };
  };

export default updateModulesVisibility;
