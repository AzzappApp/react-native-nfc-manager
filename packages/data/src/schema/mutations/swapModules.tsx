import { GraphQLID, GraphQLNonNull } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import { db, getCardModulesByIds, updateCardModule } from '#domains';
import CardGraphQL from '#schema/CardGraphQL';
import type { GraphQLContext } from '../GraphQLContext';

type SwapModulesInput = {
  moduleAId: string;
  moduleBId: string;
};

const swapModules = mutationWithClientMutationId({
  name: 'SwapModules',
  inputFields: {
    moduleAId: { type: new GraphQLNonNull(GraphQLID) },
    moduleBId: { type: new GraphQLNonNull(GraphQLID) },
  },
  outputFields: {
    card: {
      type: new GraphQLNonNull(CardGraphQL),
    },
  },
  mutateAndGetPayload: async (
    { moduleAId, moduleBId }: SwapModulesInput,
    { auth, cardByProfileLoader }: GraphQLContext,
  ) => {
    const profileId = getProfileId(auth);
    if (!profileId) {
      throw new Error(ERRORS.UNAUTORIZED);
    }
    const card = await cardByProfileLoader.load(profileId);
    if (!card) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }
    const [moduleA, moduleB] = await getCardModulesByIds([
      moduleAId,
      moduleBId,
    ]);
    if (
      !moduleA ||
      !moduleB ||
      moduleA.cardId !== card.id ||
      moduleB.cardId !== card.id
    ) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    try {
      await db.transaction().execute(async trx => {
        await updateCardModule(moduleAId, { position: moduleB.position }, trx);
        await updateCardModule(moduleBId, { position: moduleA.position }, trx);
      });
    } catch (e) {
      console.error(e);
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }

    return { card };
  },
});

export default swapModules;
