import {
  DEFAULT_CARD_COVER,
  COVER_RATIO,
} from '@azzapp/shared/lib/cardHelpers';
import ERRORS from '@azzapp/shared/lib/errors';
import {
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { v4 as uuid } from 'uuid';
import { db } from '../../domains';
import UserGraphQL from '../UserGraphQL';
import { MediaInputGraphQL } from './commonsTypes';
import type { Card, Media, CardCover, User } from '../../domains';
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
    updates: Partial<Omit<CardCover, 'id'>> & {
      pictures?: Array<Omit<Media, 'id' | 'ownerId'>>;
    },
    {
      userInfos: { userId, isAnonymous },
      userLoader,
      cardByUserLoader,
      coverLoader,
    }: GraphQLContext,
  ) => {
    if (!userId || isAnonymous) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    if (updates.pictures) {
      updates.pictures.forEach(media => {
        media.ratio = COVER_RATIO;
      });
    }

    let user: User | null;
    try {
      user = await userLoader.load(userId);
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    if (!user) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    let card: Card | null;
    try {
      card = await cardByUserLoader.load(userId);
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }

    if (!card && (!updates.title || !updates.pictures?.length)) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    const cover: CardCover = card
      ? ((await coverLoader.load(card.coverId)) as CardCover)
      : {
          id: uuid(),
          ...DEFAULT_CARD_COVER,
          title: updates.title!,
        };

    try {
      await db.transaction().execute(async trx => {
        const coverExists = !!card;
        if (!coverExists) {
          await trx
            .insertInto('Card')
            .values({
              id: uuid(),
              userId,
              isMain: true,
              coverId: cover.id,
            })
            .execute();
          await trx.insertInto('CardCover').values(cover).execute();
        } else {
          await trx
            .updateTable('CardCover')
            .set(updates)
            .where('id', '=', cover.id)
            .execute();
        }
        if (updates.pictures) {
          if (coverExists) {
            await trx
              .deleteFrom('Media')
              .where('ownerId', '=', cover.id)
              .execute();
          }
          await trx
            .insertInto('Media')
            .values(
              updates.pictures.map(media => ({
                id: uuid(),
                ownerId: cover.id,
                ...media,
              })),
            )
            .execute();
        }
      });
    } catch {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }

    return { user };
  },
});

export default updateCover;
