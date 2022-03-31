import ERRORS from '@azzapp/shared/lib/errors';
import { GraphQLNonNull, GraphQLString } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { getUserById } from '../../domains/User';
import {
  getUserMainUserCard,
  createUserCard,
  updateUserCard,
} from '../../domains/UserCard';
import UserGraphQL from '../UserGraphQL';
import type { User } from '../../domains/User';
import type { UserCardCover, UserCard } from '../../domains/UserCard';
import type { GraphQLContext } from '../GraphQLContext';

const updateCover = mutationWithClientMutationId({
  name: 'UpdateCover',
  inputFields: {
    picture: {
      type: GraphQLString,
    },
    title: {
      type: GraphQLString,
    },
  },
  outputFields: {
    user: {
      type: new GraphQLNonNull(UserGraphQL),
    },
  },
  mutateAndGetPayload: async (
    { picture, title }: { picture: string | null; title: string | null },
    { userId, isAnonymous }: GraphQLContext,
  ) => {
    if (!userId || isAnonymous) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    let user: User | null;
    try {
      user = await getUserById(userId);
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    if (!user) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    let card: UserCard | null;
    try {
      card = await getUserMainUserCard(userId);
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }

    let cover: UserCardCover | null = card?.cover ?? null;
    if (!cover) {
      if (!picture || !title) {
        throw new Error(ERRORS.INVALID_REQUEST);
      }
      cover = { picture, title };
    } else {
      if (picture) {
        cover.picture = picture;
      }
      if (title) {
        cover.title = title;
      }
    }
    try {
      if (!card) {
        await createUserCard({ userId, main: true, cover, modules: [] });
      } else {
        await updateUserCard(userId, card.cardId, { cover });
      }
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }

    return { user };
  },
});

export default updateCover;
