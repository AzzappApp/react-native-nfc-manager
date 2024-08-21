import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import {
  getCardModulesByIds,
  resetCardModulesPositions,
  transaction,
  updateCardModule,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import type { MutationResolvers } from '#/__generated__/types';

const reorderModules: MutationResolvers['reorderModules'] = async (
  _,
  { webCardId: gqlWebCardId, input: { modulesIds } },
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
    transaction(async () => {
      for (let index = 0; index < modulesIds.length; index++) {
        const moduleId = modulesIds[index];
        await updateCardModule(moduleId, { position: index });
      }
      await resetCardModulesPositions(webCardId);
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  const webCard = await loaders.WebCard.load(webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  cardUsernamesToRevalidate.add(webCard.userName);

  return { webCard };
};

export default reorderModules;
