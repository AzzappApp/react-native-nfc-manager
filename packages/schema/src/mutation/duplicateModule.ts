import { GraphQLError } from 'graphql';
import omit from 'lodash/omit';
import {
  createCardModules,
  getCardModulesByIds,
  referencesMedias,
  transaction,
  updateCardModulesPosition,
  getCardModulesByWebCard,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard } from '#externals';
import { webCardLoader } from '#loaders';
import { checkWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { MODULES_SAVE_RULES } from './ModulesMutationsResolvers';
import type { MutationResolvers } from '#/__generated__/types';

const duplicateModule: MutationResolvers['duplicateModule'] = async (
  _,
  { webCardId: gqlWebCardId, input: { modulesIds } },
) => {
  const modules = (await getCardModulesByIds(modulesIds))
    .filter(module => module != null)
    .sort((a, b) => a.position - b.position);
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

  let createdModuleIds: string[] = [];
  try {
    await transaction(async () => {
      const allModules = await getCardModulesByWebCard(webCardId);

      // create holes in modules position list
      // 1 find the last index of old modules
      const lastModule = modules[modules.length - 1];

      // 2 Append create Hole
      const nextModulesIdx = allModules.findIndex(
        module => module.id === lastModule.id,
      );
      const lastModulePosition = allModules[nextModulesIdx].position;

      if (nextModulesIdx !== allModules.length) {
        // do not put hole at the end of the list
        const nextModules = allModules
          .slice(nextModulesIdx + 1, allModules.length)
          .map(m => m.id);
        await updateCardModulesPosition(webCardId, nextModules, modules.length);
      }

      // 3 add the new modules in the Hole
      const modulesToCreate = modules.map((m, index) => ({
        ...omit(m, 'id'),
        position: index + lastModulePosition + 1,
      }));

      // duplicate modules
      createdModuleIds = await createCardModules(modulesToCreate);

      // clean up media
      const moduleMedias = modules.flatMap(m => {
        const saveRules = MODULES_SAVE_RULES[m.kind];
        if (saveRules && 'getMedias' in saveRules) {
          return saveRules.getMedias?.(m.data as any) ?? [];
        }
        return [];
      });
      if (moduleMedias.length) {
        await referencesMedias(moduleMedias, []);
      }
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  const webCard = await webCardLoader.load(webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
  if (webCard.userName) {
    invalidateWebCard(webCard.userName);
  }
  return {
    createdModules: modules.map((module, index) => ({
      originalModuleId: module.id,
      newModuleId: createdModuleIds[index],
    })),
    webCard,
  };
};

export default duplicateModule;
