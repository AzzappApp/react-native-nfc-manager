/* eslint-disable @typescript-eslint/ban-ts-comment */
import { omit } from 'lodash';
import { getProfileId } from '@azzapp/auth/viewer';
import {
  PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES,
  MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
} from '@azzapp/shared/cardModuleHelpers';
import { getMediaInfoByPublicIds } from '@azzapp/shared/cloudinaryHelpers';
import ERRORS from '@azzapp/shared/errors';
import {
  createCardModule,
  getCardModuleCount,
  getCardModulesByIds,
  updateCardModule,
  db,
  createMedia,
  removeMedias,
} from '#domains';
import type { Card, CardModule } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';
import type { CloudinaryResource } from '@azzapp/shared/cloudinaryHelpers';

const savePhotoWithTextAndTitleModule: MutationResolvers['savePhotoWithTextAndTitleModule'] =
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
        console.log(e);
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
            kind: MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
            position: await getCardModuleCount(card!.id),
            data: {
              ...PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES,
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
          await removeMedias([module.data.image]);
        }
      }

      return { card };
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
  };

export default savePhotoWithTextAndTitleModule;
