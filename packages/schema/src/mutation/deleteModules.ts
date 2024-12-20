import { GraphQLError } from 'graphql';
import {
  getCardModulesByIds,
  referencesMedias,
  removeCardModules,
  resetCardModulesPositions,
  transaction,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard } from '#externals';
import { webCardLoader } from '#loaders';
import { checkWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { MODULES_SAVE_RULES } from './ModulesMutationsResolvers';
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

  await checkWebCardProfileEditorRight(webCardId);

  try {
    await transaction(async () => {
      await removeCardModules(modulesIds);

      const moduleMedias = modules.flatMap(m => {
        if (m) {
          const saveRules = MODULES_SAVE_RULES[m.kind];
          if (saveRules && 'getMedias' in saveRules) {
            return saveRules.getMedias?.(m.data as any) ?? [];
          }
        }
        return [];
      });

      await referencesMedias([], moduleMedias);

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
  if (webCard.userName) {
    invalidateWebCard(webCard.userName);
  }
  return { webCard };
};

export default deleteModules;
