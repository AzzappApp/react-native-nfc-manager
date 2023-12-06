import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { addFilteredWebCardSuggestion } from '#domains/filteredWebCardSuggestions';
import type { MutationResolvers } from '#schema/__generated__/types';

const filterWebCardSuggestionMutation: MutationResolvers['filterWebCardSuggestion'] =
  async (_, { input: { webCardId } }, { auth, loaders }) => {
    const { profileId } = auth;
    if (!profileId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const profile = await loaders.Profile.load(profileId);
    if (!profile) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const { type, id } = fromGlobalId(webCardId);

    if (type !== 'WebCard') {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }
    const webCard = await loaders.WebCard.load(id);
    if (!webCard || !webCard.cardIsPublished) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    try {
      await addFilteredWebCardSuggestion(profileId, id);
    } catch (e) {
      console.error(e);
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }

    if (!webCard) {
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }

    return { webCard };
  };

export default filterWebCardSuggestionMutation;
