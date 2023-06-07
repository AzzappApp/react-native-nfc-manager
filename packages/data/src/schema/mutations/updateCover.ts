/* eslint-disable @typescript-eslint/ban-ts-comment */
import { getProfileId } from '@azzapp/auth/viewer';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
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
import type { Card, CoverUpdates, Media } from '#domains';
import type { Database } from '#domains/db';
import type { MutationResolvers } from '#schema/__generated__/types';
import type { Prisma } from '@prisma/client';
import type { Transaction } from 'kysely';

const updateCover: MutationResolvers['updateCover'] = async (
  _,
  { input },
  { auth, cardByProfileLoader, profileLoader, coverLoader, mediaLoader },
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
            mediaStyle: input.mediaStyle as Prisma.JsonValue,
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

        const entries = convertToNonNullArray(typedEntries(input));
        entries.forEach(async ([key, value]) => {
          switch (key) {
            case 'media':
              if (value) {
                updates.mediaId = value.id;
                mediaOperations.push(
                  ...replaceMedia(cover.mediaId, input.media, trx),
                );
              }
              break;
            case 'sourceMedia':
              if (value) {
                updates.sourceMediaId = value.id;
                //be sure the media does not exist already (from covertemplate)
                if (
                  input.sourceMedia &&
                  (await mediaLoader.load(input.sourceMedia.id)) == null
                ) {
                  await createMedia(input.sourceMedia, trx);
                }
              }
              break;
            case 'maskMedia':
              if (value) {
                updates.maskMediaId = value.id;
                mediaOperations.push(
                  ...replaceMedia(cover.maskMediaId, input.maskMedia, trx),
                );
              }
              break;
            case 'textPreviewMedia':
              if (value) {
                updates.textPreviewMediaId = value.id;
                mediaOperations.push(
                  ...replaceMedia(
                    cover.textPreviewMediaId,
                    input.textPreviewMedia,
                    trx,
                  ),
                );
              }
              break;
            case 'mediaStyle':
              updates.mediaStyle = value as Prisma.JsonValue;
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
              updates.segmented = value ?? undefined;
              break;
            case 'merged':
              updates.merged = value ?? undefined;
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
            default:
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
            backgroundColor: null,
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
};

export default updateCover;

const replaceMedia = (
  oldMediaId: string | null | undefined,
  newMedia: Media | null | undefined,
  trx: Transaction<Database>,
) => {
  if (oldMediaId === newMedia?.id) {
    return [];
  }
  //if the media is used in the coverTemplate, we cannot delete it (need a request in json)
  return [
    // TODO remove media from cloudinary
    oldMediaId ? removeMedia(oldMediaId, trx) : null,
    newMedia ? createMedia(newMedia, trx) : null,
  ];
};
