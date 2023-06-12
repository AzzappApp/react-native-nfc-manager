/* eslint-disable @typescript-eslint/ban-ts-comment */
import { getProfileId } from '@azzapp/auth/viewer';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import ERRORS from '@azzapp/shared/errors';
import { typedEntries } from '@azzapp/shared/objectHelpers';
import {
  createCard,
  createCardCover,
  createMedia,
  createMedias,
  db,
  removeMedias,
  updateCardCover,
} from '#domains';
import type { Card, CoverUpdates, Media, NewMedia } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

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
    await db.transaction(async trx => {
      let coverId;
      if (!cover) {
        // souceMedia can exist in `Media` table (business template + using business image)
        const mediaExist =
          (await mediaLoader.load(input.sourceMedia!.id)) != null;

        const mediasToCreate = [input.media!, input.textPreviewMedia!].concat(
          input.maskMedia ?? [],
        );

        if (!mediaExist) {
          mediasToCreate.push(input.sourceMedia!);
        }

        await createMedias(mediasToCreate, trx);

        const cover = await createCardCover(
          {
            mediaId: input.media!.id,
            mediaStyle: input.mediaStyle,
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
        coverId = cover.id;

        const mediasToCreate: NewMedia[] = [];
        const mediasToDelete: string[] = [];

        const updates: CoverUpdates = {};

        const entries = convertToNonNullArray(typedEntries(input));
        entries.forEach(async ([key, value]) => {
          switch (key) {
            case 'media':
              if (value) {
                updates.mediaId = value.id;
                replaceMedia(
                  cover.mediaId,
                  input.media,
                  mediasToCreate,
                  mediasToDelete,
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

                replaceMedia(
                  cover.maskMediaId,
                  input.maskMedia,
                  mediasToCreate,
                  mediasToDelete,
                );
              }
              break;
            case 'textPreviewMedia':
              if (value) {
                updates.textPreviewMediaId = value.id;

                replaceMedia(
                  cover.textPreviewMediaId,
                  input.textPreviewMedia,
                  mediasToCreate,
                  mediasToDelete,
                );
              }
              break;
            case 'mediaStyle':
              updates.mediaStyle = value;
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
              updates.segmented = value ?? false;
              break;
            case 'merged':
              updates.merged = value ?? false;
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

        await Promise.all([
          createMedias(mediasToCreate, trx),
          removeMedias(mediasToDelete, trx),
        ]);

        await updateCardCover(coverId, updates, trx);

        coverLoader.clear(coverId);
      }

      if (!card) {
        await createCard(
          {
            profileId,
            isMain: true,
            coverId,
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
  mediasToCreate: NewMedia[],
  mediasToDelete: string[],
) => {
  console.log({ oldMediaId, new: newMedia?.id });
  if (oldMediaId === newMedia?.id) {
    return;
  }

  if (oldMediaId) {
    mediasToDelete.push(oldMediaId);
  }
  if (newMedia) {
    mediasToCreate.push(newMedia);
  }
};
