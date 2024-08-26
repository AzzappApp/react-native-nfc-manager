import { GraphQLError } from 'graphql';
import {
  getCardModulesByIds,
  removeCardModules,
  resetCardModulesPositions,
  transaction,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard } from '#externals';
import { webCardLoader } from '#loaders';
import { hasWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const deleteModules: MutationResolvers['deleteModules'] = async (
  _,
  { webCardId: gqlWebCardId, input: { modulesIds } },
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

  if (!(await hasWebCardProfileEditorRight(webCardId))) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  try {
    await transaction(async () => {
      await removeCardModules(modulesIds);
      await resetCardModulesPositions(webCardId);
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  const webCard = await webCardLoader.load(webCardId);

  if (!webCard) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  invalidateWebCard(webCard.userName);

  return { webCard };
};

export default deleteModules;
