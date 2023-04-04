/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLString,
} from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { GraphQLJSON } from 'graphql-scalars';
import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import { typedEntries } from '@azzapp/shared/objectHelpers';
import {
  createCard,
  createCardCover,
  createMedia,
  db,
  removeMedia,
  updateCardCover,
} from '#domains';
import { CardCoverTitleOrientationGraphQL } from '../CardGraphQL';
import ProfileGraphQL from '../ProfileGraphQL';
import { MediaInputGraphQL } from './commonsTypes';
import type { Card, CoverUpdates, Media } from '#domains';
import type { Database } from '#domains/db';
import type { GraphQLContext } from '../GraphQLContext';
import type { Transaction } from 'kysely';

type UpdateCoverInput = Partial<{
  media: Media;
  mediaStyle: unknown;
  sourceMedia: Media;
  textPreviewMedia: Media;
  maskMedia: Media;
  backgroundId: string;
  backgroundStyle: {
    backgroundColor: string;
    patternColor: string;
  };
  foregroundId: string;
  foregroundStyle: {
    color: string;
  };
  segmented: boolean;
  merged: boolean;
  title: string;
  contentStyle: {
    orientation: 'bottomToTop' | 'horizontal' | 'topToBottom';
  };
  titleStyle: {
    color: string;
    fontSize: number;
    fontFamily: string;
  };
  subTitle: string;
  subTitleStyle: {
    color: string;
    fontSize: number;
    fontFamily: string;
  };
}>;

const updateCover = mutationWithClientMutationId({
  name: 'UpdateCover',
  inputFields: () => ({
    media: { type: MediaInputGraphQL },
    mediaStyle: { type: GraphQLJSON },
    sourceMedia: { type: MediaInputGraphQL },
    textPreviewMedia: { type: MediaInputGraphQL },
    maskMedia: { type: MediaInputGraphQL },
    backgroundId: { type: GraphQLString },
    backgroundStyle: { type: CardCoverBackgroundStyleInputGraphQL },
    foregroundId: { type: GraphQLString },
    foregroundStyle: { type: CardCoverForegroundStyleInputGraphQL },
    segmented: { type: GraphQLBoolean },
    merged: { type: GraphQLBoolean },
    title: { type: GraphQLString },
    contentStyle: { type: CardCoverContentStyleInputGraphQL },
    titleStyle: { type: CardCoverTextStyleInputGraphQL },
    subTitle: { type: GraphQLString },
    subTitleStyle: { type: CardCoverTextStyleInputGraphQL },
  }),
  outputFields: {
    profile: {
      type: ProfileGraphQL,
    },
  },
  mutateAndGetPayload: async (
    input: UpdateCoverInput,
    {
      auth,
      cardByProfileLoader,
      profileLoader,
      coverLoader,
      mediaLoader,
    }: GraphQLContext,
  ) => {
    const profileId = getProfileId(auth);
    if (!profileId) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    let card: Card | null;
    try {
      card = await cardByProfileLoader.load(profileId);
    } catch (e) {
      console.log(e);
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }

    const cover =
      card?.coverId != null ? await coverLoader.load(card.coverId) : null;

    if (
      !cover &&
      (!input.media ||
        !input.textPreviewMedia ||
        !input.title ||
        !input.sourceMedia)
    ) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    try {
      await db.transaction().execute(async trx => {
        let coverId = cover?.id;
        if (!cover) {
          // souceMedia can exist in `Media` table (business template + using business image)
          const mediaExist =
            (await mediaLoader.load(input.sourceMedia!.id)) != null;

          await Promise.all([
            createMedia(input.media!, trx),
            !mediaExist && createMedia(input.sourceMedia!, trx),
            createMedia(input.textPreviewMedia!, trx),
            input.maskMedia && createMedia(input.maskMedia, trx),
          ]);

          const cover = await createCardCover(
            {
              mediaId: input.media!.id,
              mediaStyle: input.mediaStyle as any,
              sourceMediaId: input.sourceMedia!.id,
              textPreviewMediaId: input.textPreviewMedia!.id,
              maskMediaId: input.maskMedia?.id ?? null,
              backgroundId: input.backgroundId ?? null,
              backgroundStyle: input.backgroundStyle ?? null,
              foregroundId: input.foregroundId ?? null,
              foregroundStyle: input.foregroundStyle ?? null,
              segmented: input.segmented ?? false,
              merged: input.merged ?? false,
              title: input.title!,
              titleStyle: input.titleStyle ?? null,
              subTitle: input.subTitle ?? null,
              subTitleStyle: input.subTitleStyle ?? null,
              contentStyle: input.contentStyle ?? null,
            },
            trx,
          );
          coverId = cover.id;
        } else {
          const mediaOperations: Array<Promise<any> | null> = [];
          const updates: CoverUpdates = {};

          const entries = typedEntries(input);
          entries.forEach(([key, value]) => {
            switch (key) {
              case 'media':
                updates.mediaId = value.id;
                mediaOperations.push(
                  ...replaceMedia(cover.mediaId, input.media, trx),
                );
                break;
              case 'sourceMedia':
                updates.sourceMediaId = value.id;
                mediaOperations.push(
                  ...replaceMedia(null, input.sourceMedia, trx),
                );
                break;
              case 'maskMedia':
                updates.maskMediaId = value.id;
                mediaOperations.push(
                  ...replaceMedia(cover.maskMediaId, input.maskMedia, trx),
                );
                break;
              case 'textPreviewMedia':
                updates.textPreviewMediaId = value.id;
                mediaOperations.push(
                  ...replaceMedia(
                    cover.textPreviewMediaId,
                    input.textPreviewMedia,
                    trx,
                  ),
                );
                break;
              case 'mediaStyle':
                updates.mediaStyle = value as any;
                break;
              case 'backgroundId':
                updates.backgroundId = value;
                break;
              case 'backgroundStyle':
                updates.backgroundStyle = value;
                break;
              case 'foregroundId':
                updates.foregroundId = value;
                break;
              case 'foregroundStyle':
                updates.foregroundStyle = value;
                break;
              case 'segmented':
                updates.segmented = value;
                break;
              case 'merged':
                updates.merged = value;
                break;
              case 'title':
                updates.title = value;
                break;
              case 'contentStyle':
                updates.contentStyle = value;
                break;
              case 'titleStyle':
                updates.titleStyle = value;
                break;
              case 'subTitle':
                updates.subTitle = value;
                break;
              case 'subTitleStyle':
                updates.subTitleStyle = value;
                break;
            }
          });

          await Promise.all(mediaOperations);

          await updateCardCover(coverId!, updates, trx);

          coverLoader.clear(coverId!);
        }
        if (!card) {
          await createCard(
            {
              profileId,
              isMain: true,
              coverId: coverId!,
            },
            trx,
          );
        }
      });
    } catch (e) {
      console.log(e);
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }

    profileLoader.clear(profileId);
    cardByProfileLoader.clear(profileId);
    if (card?.coverId) {
      coverLoader.clear(card.coverId);
    }
    if (input.sourceMedia?.id) {
      mediaLoader.clear(input.sourceMedia.id);
    }
    const profile = await profileLoader.load(profileId);

    return { profile };
  },
});

export default updateCover;

export const CardCoverBackgroundStyleInputGraphQL = new GraphQLInputObjectType({
  name: 'CardCoverBackgroundStyleInput',
  description: 'Style of the background of a card cover',
  fields: () => ({
    backgroundColor: { type: GraphQLString },
    patternColor: { type: GraphQLString },
  }),
});

export const CardCoverForegroundStyleInputGraphQL = new GraphQLInputObjectType({
  name: 'CardCoverForegroundStyleInput',
  description: 'Style of the foreground of a card cover',
  fields: () => ({
    color: { type: GraphQLString },
  }),
});

export const CardCoverContentStyleInputGraphQL = new GraphQLInputObjectType({
  name: 'CardCoverContentStyleInput',
  description: 'Style of the content of a card cover',
  fields: () => ({
    orientation: { type: CardCoverTitleOrientationGraphQL },
    placement: { type: GraphQLString }, // TODO enum
  }),
});

export const CardCoverTextStyleInputGraphQL = new GraphQLInputObjectType({
  name: 'CardCoverTextStyleInput',
  description: 'Style of the text in a  a card cover',
  fields: () => ({
    color: { type: GraphQLString },
    fontSize: { type: GraphQLInt },
    fontFamily: { type: GraphQLString },
  }),
});

const replaceMedia = (
  oldMediaId: string | null | undefined,
  newMedia: Media | null | undefined,
  trx: Transaction<Database>,
) => {
  if (oldMediaId === newMedia?.id) {
    return [];
  }
  return [
    // TODO remove media from cloudinary
    oldMediaId ? removeMedia(oldMediaId, trx) : null,
    newMedia ? createMedia(newMedia, trx) : null,
  ];
};
