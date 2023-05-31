/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLString } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
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
import CardGraphQL from '#schema/CardGraphQL';
import { ModuleBackgroundStyleInputGraphQL } from './commonsInputTypes';
import type { Card, CardModule } from '#domains';
import type { GraphQLContext } from '../GraphQLContext';
import type { CloudinaryResource } from '@azzapp/shared/cloudinaryHelpers';

type SaveHorizontalPhotoModuleInput = Partial<{
  moduleId: string;
  kind: string;
  borderWidth: number;
  borderRadius: number;
  borderColor: string;
  marginHorizontal: number;
  marginVertical: number;
  height: number;
  color: string;
  tintColor: string;
  image: string;
  backgroundId: string;
  backgroundStyle: {
    backgroundColor: string;
    patternColor: string;
    opacity: number;
  };
}>;

const saveHorizontalPhotoModule = mutationWithClientMutationId({
  name: 'SaveHorizontalPhotoModule',
  inputFields: () => ({
    moduleId: {
      type: GraphQLID,
    },
    image: {
      type: new GraphQLNonNull(GraphQLString),
    },
    borderWidth: {
      type: GraphQLInt,
    },
    borderRadius: {
      type: GraphQLInt,
    },
    borderColor: {
      type: GraphQLString,
    },
    marginHorizontal: {
      type: GraphQLInt,
    },
    marginVertical: {
      type: GraphQLInt,
    },
    height: {
      type: GraphQLInt,
    },
    color: {
      type: GraphQLString,
    },
    tintColor: {
      type: GraphQLString,
    },
    backgroundId: {
      type: GraphQLID,
    },
    backgroundStyle: {
      type: ModuleBackgroundStyleInputGraphQL,
    },
  }),
  outputFields: {
    card: {
      type: new GraphQLNonNull(CardGraphQL),
    },
  },
  mutateAndGetPayload: async (
    input: SaveHorizontalPhotoModuleInput,
    { auth, cardByProfileLoader, mediaLoader }: GraphQLContext,
  ) => {
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
    if (input.image && input.image !== (module?.data as any)?.image) {
      newImage = (
        await getMediaInfoByPublicIds([
          { publicId: input.image, kind: 'image' },
        ])
      )[0];
    }

    try {
      await db.transaction().execute(async trx => {
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
        mediaLoader.clear(input.image!);
        await removeMedias([(module?.data as any)?.image]);
      }

      return { card };
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
  },
});

export default saveHorizontalPhotoModule;
