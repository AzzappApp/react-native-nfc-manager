/* eslint-disable @typescript-eslint/ban-ts-comment */
import { omit } from 'lodash';
import { getProfileId } from '@azzapp/auth/viewer';
import { HORIZONTAL_PHOTO_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import { getMediaInfoByPublicIds } from '@azzapp/shared/cloudinaryHelpers';
import ERRORS from '@azzapp/shared/errors';
import {
  createCardModule,
  createMedia,
  db,
  getCardModuleCount,
  getCardModulesByIds,
  removeMedias,
  updateCardModule,
} from '#domains';
import type { Card, CardModule } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';
import type { CloudinaryResource } from '@azzapp/shared/cloudinaryHelpers';

const saveHorizontalPhotoModule: MutationResolvers['saveHorizontalPhotoModule'] =
  async (_, { input }, { auth, cardByProfileLoader, mediaLoader }) => {
    const profileId = getProfileId(auth);
    if (!profileId) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    let card: Card | null;
    try {
      card = await cardByProfileLoader.load(profileId);
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    if (!card) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    let module: CardModule | null = null;
    if (input.moduleId) {
      try {
        [module] = await getCardModulesByIds([input.moduleId]);
      } catch (e) {
        throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
      }
      if (!module || module.cardId !== card.id) {
        throw new Error(ERRORS.INVALID_REQUEST);
      }
    }
    let newImage: CloudinaryResource | undefined = undefined;
    if (input.image && input.image !== module?.data?.image) {
      newImage = (
        await getMediaInfoByPublicIds([
          { publicId: input.image, kind: 'image' },
        ])
      )[0];
    }

    try {
      await db.transaction(async trx => {
        if (newImage) {
          await createMedia(
            {
              id: newImage.public_id,
              height: newImage.height,
              width: newImage.width,
              kind: 'image',
            },
            trx,
          );
        }
        if (module) {
          await updateCardModule(
            module.id,
            {
              data: {
                ...(module.data as object),
                ...omit(input, 'moduleId'),
              },
            },
            trx,
          );
        } else {
          await createCardModule({
            cardId: card!.id,
            kind: 'horizontalPhoto',
            position: await getCardModuleCount(card!.id),
            data: {
              ...HORIZONTAL_PHOTO_DEFAULT_VALUES,
              ...omit(input, 'moduleId'),
            },
            visible: true,
          });
        }
      });
      //this is mandatory or the media return will be null
      if (newImage) {
        mediaLoader.clear(input.image);
        if (module?.data?.image) {
          await removeMedias([module?.data?.image]);
        }
      }

      return { card };
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
  };

export default saveHorizontalPhotoModule;
