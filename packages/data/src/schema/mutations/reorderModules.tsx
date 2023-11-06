import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import {
  db,
  getCardModulesByIds,
  resetCardModulesPositions,
  updateCardModule,
} from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const reorderModules: MutationResolvers['reorderModules'] = async (
  _,
  { input: { moduleIds } },
  { auth, cardUsernamesToRevalidate, loaders },
) => {
  const { profileId } = auth;
  if (!profileId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const profile = await loaders.Profile.load(profileId);
  if (!profile || !isEditor(profile.profileRole)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }
  const modules = await getCardModulesByIds(moduleIds);
  if (modules.some(module => module?.webCardId !== profile.webCardId)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  try {
    await db.transaction(async trx => {
      for (let index = 0; index < moduleIds.length; index++) {
        const moduleId = moduleIds[index];
        await updateCardModule(moduleId, { position: index }, trx);
      }
      await resetCardModulesPositions(profileId, trx);
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
