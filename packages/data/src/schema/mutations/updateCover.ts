import { DEFAULT_CARD_COVER } from '@azzapp/shared/lib/cardHelpers';
import ERRORS from '@azzapp/shared/lib/errors';
import {
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { getUserById } from '../../domains/User';
import {
  getUserMainUserCard,
  createUserCard,
  updateUserCard,
} from '../../domains/UserCard';
import UserGraphQL from '../UserGraphQL';
import { MediaInputGraphQL } from './commonsTypes';
import type { User } from '../../domains/User';
import type { UserCardCover, UserCard } from '../../domains/UserCard';
import type { GraphQLContext } from '../GraphQLContext';

const updateCover = mutationWithClientMutationId({
  name: 'UpdateCover',
  inputFields: {
    backgroundColor: {
      type: GraphQLString,
      description: 'the background color of the card',
    },
    pictures: {
      type: new GraphQLList(new GraphQLNonNull(MediaInputGraphQL)),
      description: 'the pictures of the card cover',
    },
    pictureTransitionTimer: {
      type: GraphQLFloat,
      description:
        'the time, in seconds, a picture stay displayed before transition in case of multiple pictures',
    },
    overlayEffect: {
      type: GraphQLString,
      description: 'the overlay effect applied to the card cover',
    },
    title: {
      type: GraphQLString,
      description: 'the title of the card cover',
    },
    titlePosition: {
      type: GraphQLString,
      description: 'the title position in the card cover',
    },
    titleFont: {
      type: GraphQLString,
      description: 'the font family used to display the title',
    },
    titleFontSize: {
      type: GraphQLInt,
      description: 'the font size of used to display the title',
    },
    titleColor: {
      type: GraphQLString,
      description: 'the color used to display the title',
    },
    titleRotation: {
      type: GraphQLInt,
      description: 'the rotation of the title',
    },
    qrCodePosition: {
      type: GraphQLString,
      description: 'the position of the qr code in the card',
    },
    desktopLayout: {
      type: GraphQLString,
      description: 'the layout used to display the cover on desktop',
    },
    dektopImagePosition: {
      type: GraphQLString,
      description: 'the position of the backround image on desktop',
    },
  },
  outputFields: {
    user: {
      type: UserGraphQL,
    },
  },
  mutateAndGetPayload: async (
    updates: Partial<UserCardCover>,
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
      const { pictures, title } = updates;
      if (!pictures || !title) {
        throw new Error(ERRORS.INVALID_REQUEST);
      }
      cover = { ...DEFAULT_CARD_COVER, pictures, title };
    }

    Object.entries(updates).forEach(([key, val]) => {
      if (val != null) {
        (cover as any)[key] = val;
      }
    });
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
