import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import { db, getCardModulesByIds } from '#domains';
import CardGraphQL from '#schema/CardGraphQL';
import type { GraphQLContext } from '#index';

type UpdateModulesVisibilityInput = {
  modulesIds: string[];
  visible: boolean;
};

const updateModulesVisibility = mutationWithClientMutationId({
  name: 'UpdateModulesVisibility',
  inputFields: {
    modulesIds: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLID))),
    },
    visible: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
  },
  outputFields: {
    card: {
      type: new GraphQLNonNull(CardGraphQL),
    },
  },
  mutateAndGetPayload: async (
    { modulesIds, visible }: UpdateModulesVisibilityInput,
    { auth, cardByProfileLoader }: GraphQLContext,
  ) => {
    const profileId = getProfileId(auth);
    if (!profileId) {
      throw new Error(ERRORS.UNAUTORIZED);
    }
    if (modulesIds.length === 0) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    const card = await cardByProfileLoader.load(profileId);
    if (!card) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }
    const modules = await getCardModulesByIds(modulesIds);
    if (!modules.every(module => module != null && module.cardId === card.id)) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    try {
      await db
        .updateTable('CardModule')
        .set({ visible })
        .where('id', 'in', modulesIds)
        .execute();
    } catch (e) {
      console.error(e);
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    return { card };
  },
});

export default updateModulesVisibility;
