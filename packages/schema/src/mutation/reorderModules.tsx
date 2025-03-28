import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import {
  getCardModulesByIds,
  getWebCardById,
  resetCardModulesPositions,
  transaction,
  updateCardModule,
  updateWebCard,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard, notifyWebCardUsers } from '#externals';
import { checkWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const reorderModules: MutationResolvers['reorderModules'] = async (
  _,
  { webCardId: gqlWebCardId, input: { modulesIds } },
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

  const webCard = await getWebCardById(webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  const previousUpdateDate = webCard.updatedAt;

  await checkWebCardProfileEditorRight(webCardId);

  try {
    transaction(async () => {
      for (let index = 0; index < modulesIds.length; index++) {
        const moduleId = modulesIds[index];
        await updateCardModule(moduleId, { position: index });
      }
      await resetCardModulesPositions(webCardId);
      await updateWebCard(webCardId, { updatedAt: new Date() });
    });
    await notifyWebCardUsers(webCard, previousUpdateDate);
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }
  if (webCard.userName) {
    invalidateWebCard(webCard.userName);
  }
  return { webCard };
};

export default reorderModules;
