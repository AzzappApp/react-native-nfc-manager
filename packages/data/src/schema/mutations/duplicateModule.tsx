import { GraphQLID, GraphQLNonNull } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import omit from 'lodash/omit';
import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import { db, createCardModule, getCardModulesByIds } from '#domains';
import CardGraphQL from '#schema/CardGraphQL';
import type { GraphQLContext } from '../GraphQLContext';

type DuplicateModuleInput = {
  moduleId: string;
};

const duplicateModule = mutationWithClientMutationId({
  name: 'DuplicateModule',
  inputFields: {
    moduleId: { type: new GraphQLNonNull(GraphQLID) },
  },
  outputFields: {
    card: {
      type: new GraphQLNonNull(CardGraphQL),
    },
    createdModuleId: {
      type: new GraphQLNonNull(GraphQLID),
    },
  },
  mutateAndGetPayload: async (
    { moduleId }: DuplicateModuleInput,
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
    const [module] = await getCardModulesByIds([moduleId]);
    if (!module || module.cardId !== card.id) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    let createdModuleId: string | null = null;
    try {
      await db.transaction().execute(async trx => {
        await trx
          .updateTable('CardModule')
          .set(({ bxp }) => ({
            position: bxp('position', '+', 1),
          }))
          .where('position', '>', module.position)
          .where('cardId', '=', card.id)
          .execute();

        const newModule = await createCardModule(
          { ...omit(module, 'id'), position: module.position + 1 },
          trx,
        );
        createdModuleId = newModule.id;
      });
    } catch (e) {
      console.error(e);
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    if (!createdModuleId) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    return { card, createdModuleId };
  },
});

export default duplicateModule;
