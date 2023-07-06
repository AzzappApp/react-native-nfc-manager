/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { getProfileId } from '@azzapp/auth/viewer';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  getMediaInfoByPublicIds,
  type CloudinaryResource,
} from '@azzapp/shared/cloudinaryHelpers';
import ERRORS from '@azzapp/shared/errors';
import { typedEntries } from '@azzapp/shared/objectHelpers';
import {
  createCard,
  createCardCover,
  createMedias,
  db,
  getMediasByIds,
  removeMedias,
  updateCardCover,
} from '#domains';
import type { Card, CoverUpdates, Media } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const updateCover: MutationResolvers['updateCover'] = async (
  _,
  { input },
  {
    auth,
    cardByProfileLoader,
    profileLoader,
    coverLoader,
    mediaLoader,
    cardUpdateListener,
  },
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
    (!input.mediaId ||
      !input.textPreviewMediaId ||
      !input.title ||
      !input.sourceMediaId)
  ) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  try {
    await db.transaction(async trx => {
      let coverId;
      if (!cover) {
        if (!(input.sourceMediaId && input.mediaId)) {
          //mandatory in case of create
          throw new Error(ERRORS.INVALID_REQUEST);
        }
        //check if the media is from a template business(don't use mediaLoaderon purpose)
        const [existingSourceMedia] = await getMediasByIds(
          [input.sourceMediaId],
          trx,
        );
        const medias: Media[] = [];
        let cloudinarySourceMedia: CloudinaryResource | undefined = undefined;
        if (!existingSourceMedia) {
          //find the media in cloudinary (image or video, we don't know. this is bad
          [cloudinarySourceMedia] = await getMediaInfoByPublicIds([
            { publicId: input.sourceMediaId, kind: 'image' },
            { publicId: input.sourceMediaId, kind: 'video' },
          ]);
        }
        if (cloudinarySourceMedia == null) {
          throw new Error(ERRORS.INVALID_REQUEST);
        }
        medias.push({
          id: cloudinarySourceMedia.public_id,
          kind: cloudinarySourceMedia.resource_type,
          width: cloudinarySourceMedia.width,
          height: cloudinarySourceMedia.height,
        });
        //find the other media in cloudinary
        const cloudinaryMedias = [
          {
            publicId: input.mediaId,
            kind: cloudinarySourceMedia.resource_type,
          },
        ];
        if (input.maskMediaId) {
          cloudinaryMedias.push({
            publicId: input.maskMediaId,
            kind: cloudinarySourceMedia.resource_type,
          });
        }
        if (input.textPreviewMediaId) {
          cloudinaryMedias.push({
            publicId: input.textPreviewMediaId,
            kind: cloudinarySourceMedia.resource_type,
          });
        }

        (await getMediaInfoByPublicIds(cloudinaryMedias)).forEach(item => {
          if (item) {
            medias.push({
              id: item.public_id,
              kind: item.resource_type,
              width: item.width,
              height: item.height,
            });
          }
        });

        await createMedias(medias, trx);

        const cover = await createCardCover(
          {
            mediaId: input.mediaId,
            mediaStyle: input.mediaStyle,
            sourceMediaId: input.sourceMediaId,
            textPreviewMediaId: input.textPreviewMediaId ?? null,
            maskMediaId: input.maskMediaId ?? null,
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

        const mediasToCreate: CloudinaryResource[] = [];
        const mediasToDelete: Array<string | null> = [];

        const updates: CoverUpdates = {};
        const entries = convertToNonNullArray(typedEntries(input));

        //extract media mangement, await does not work well within the forEach
        entries.forEach(([key, value]) => {
          switch (key) {
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
        if (input.mediaId) {
          const [media] = await getMediaInfoByPublicIds([
            { publicId: input.mediaId, kind: 'image' },
            { publicId: input.mediaId, kind: 'video' },
          ]);
          if (media) {
            mediasToCreate.push(media);
            mediasToDelete.push(cover.mediaId);
            updates.mediaId = input.mediaId;
          } else {
            throw new Error(ERRORS.INVALID_REQUEST);
          }
        }

        if (input.sourceMediaId) {
          const [sourceMedia] = await getMediaInfoByPublicIds([
            { publicId: input.sourceMediaId, kind: 'image' },
            { publicId: input.sourceMediaId, kind: 'video' },
          ]);
          if (sourceMedia) {
            updates.sourceMediaId = input.sourceMediaId;
            mediasToCreate.push(sourceMedia);
            //TODO: check if media is not use in a coverTemplate before delete it
          } else {
            throw new Error(ERRORS.INVALID_REQUEST);
          }
        }
        if (input.maskMediaId) {
          const [maskMedia] = await getMediaInfoByPublicIds([
            { publicId: input.maskMediaId, kind: 'image' },
          ]);
          if (maskMedia) {
            mediasToCreate.push(maskMedia);
            mediasToDelete.push(cover.maskMediaId);
            updates.maskMediaId = input.maskMediaId;
          }
        }
        if (input.textPreviewMediaId) {
          const [textPreviewMedia] = await getMediaInfoByPublicIds([
            { publicId: input.textPreviewMediaId, kind: 'image' },
          ]);
          if (textPreviewMedia) {
            mediasToCreate.push(textPreviewMedia);
            mediasToDelete.push(cover.textPreviewMediaId);
            updates.textPreviewMediaId = input.textPreviewMediaId;
          }
        }
        if (mediasToCreate.length > 0) {
          await createMedias(
            convertToNonNullArray(
              mediasToCreate.map(item => {
                if (item) {
                  return {
                    id: item.public_id,
                    kind: item.resource_type,
                    width: item.width,
                    height: item.height,
                  };
                }
                return null;
              }),
            ),
            trx,
          );
        }

        const deletedMedias = convertToNonNullArray(mediasToDelete);
        if (deletedMedias.length > 0) {
          await removeMedias(deletedMedias, trx);
        }
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
  if (input.mediaId) {
    mediaLoader.clear(input.mediaId);
  }
  if (input.sourceMediaId) {
    mediaLoader.clear(input.sourceMediaId);
  }
  const profile = await profileLoader.load(profileId);

  cardUpdateListener(profile!.userName);

  return { profile };
};

export default updateCover;
