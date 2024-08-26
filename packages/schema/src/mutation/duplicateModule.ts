import { GraphQLError } from 'graphql';
import omit from 'lodash/omit';
import {
  createCardModules,
  getCardModulesByIds,
  transaction,
  updateCardModulesPosition,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard } from '#externals';
import { webCardLoader } from '#loaders';
import { hasWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
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
  if (!(await hasWebCardProfileEditorRight(webCardId))) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  let createdModuleIds: string[] = [];
  try {
    await transaction(async () => {
      createdModuleIds = await createCardModules(
        modules.map((module, index) => ({
          ...omit(module, 'id'),
          position: modules[modules.length - 1].position + index + 1,
        })),
      );

      await updateCardModulesPosition(
        modules.map(module => module.id),
        modules.length,
      );
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  const webCard = await webCardLoader.load(webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  invalidateWebCard(webCard.userName);

  return {
    createdModules: modules.map((module, index) => ({
      originalModuleId: module.id,
      newModuleId: createdModuleIds[index],
    })),
    webCard,
  };
};

export default duplicateModule;
