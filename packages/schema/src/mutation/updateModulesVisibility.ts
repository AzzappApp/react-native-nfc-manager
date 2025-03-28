import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import {
  getCardModulesByIds,
  getWebCardById,
  transaction,
  updateCardModules,
  updateWebCard,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard, notifyWebCardUsers } from '#externals';
import { checkWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const updateModulesVisibility: MutationResolvers['updateModulesVisibility'] =
  async (
    _source,
    { webCardId: gqlWebCardId, input: { modulesIds, visible } },
  ) => {
    const modules = await getCardModulesByIds(modulesIds);
    if (modulesIds.length === 0) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    const webCardId = fromGlobalId(gqlWebCardId).id;
    const webCard = await getWebCardById(webCardId);

    if (!webCard) {
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }
    const previousUpdateDate = webCard.updatedAt;
    if (
      !modules.every(module => module != null && module.webCardId === webCardId)
    ) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }
    await checkWebCardProfileEditorRight(webCardId);

    try {
      await transaction(async () => {
        await updateCardModules(modulesIds, { visible });
        await updateWebCard(webCardId, { updatedAt: new Date() });
      });
      await notifyWebCardUsers(webCard, previousUpdateDate);
    } catch (e) {
      console.error(e);
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }

    if (webCard.userName) {
      invalidateWebCard(webCard.userName);
    }
    return { webCard };
  };

export default updateModulesVisibility;
