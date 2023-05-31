import { GraphQLString } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import { updateCard } from '#domains';
import CardGraphQL from '#schema/CardGraphQL';
import type { GraphQLContext } from '../GraphQLContext';

const updateCardMutation = mutationWithClientMutationId({
  name: 'UpdateCard',
  inputFields: {
    backgroundColor: {
      type: GraphQLString,
      description: 'The background color of the card',
    },
  },
  outputFields: {
    card: {
      type: CardGraphQL,
    },
  },
  mutateAndGetPayload: async (
    {
      backgroundColor,
    }: {
      backgroundColor?: string | null;
    },
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

    try {
      await updateCard(card.id, {
        backgroundColor,
      });
      return {
        card: {
          ...card,
          backgroundColor,
        },
      };
    } catch {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
  },
});

export default updateCardMutation;
