import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import {
  db,
  getCardModulesByIds,
  getUserProfileWithWebCardId,
  resetCardModulesPositions,
  updateCardModule,
} from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const reorderModules: MutationResolvers['reorderModules'] = async (
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
      for (let index = 0; index < modulesIds.length; index++) {
        const moduleId = modulesIds[index];
        await updateCardModule(moduleId, { position: index }, trx);
      }
      await resetCardModulesPositions(profile.id, trx);
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  const webCard = await loaders.WebCard.load(profile.webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  cardUsernamesToRevalidate.add(webCard.userName);

  return { webCard };
};

export default reorderModules;
