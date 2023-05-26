/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import omit from 'lodash/omit';
import { getProfileId } from '@azzapp/auth/viewer';
import {
  CAROUSEL_DEFAULT_VALUES,
  MODULE_KIND_CAROUSEL,
} from '@azzapp/shared/cardModuleHelpers';
import {
  deleteMediaByPublicIds,
  getMediaInfoByPublicIds,
} from '@azzapp/shared/cloudinaryHelpers';
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

type SaveCarouselModuleInput = Partial<{
  moduleId: string;
  images: string[];
  squareRatio: boolean;
  borderSize: number;
  borderColor: string;
  borderRadius: number;
  marginHorizontal: number;
  marginVertical: number;
  gap: number;
  backgroundId: string;
  backgroundStyle: {
    backgroundColor: string;
    patternColor: string;
    opacity: number;
  };
}>;

const saveCarouselModule = mutationWithClientMutationId({
  name: 'SaveCarouselModule',
  inputFields: () => ({
    moduleId: {
      type: GraphQLID,
    },
    images: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
    },
    squareRatio: {
      type: GraphQLBoolean,
    },
    borderSize: {
      type: GraphQLInt,
    },
    borderColor: {
      type: GraphQLString,
    },
    borderRadius: {
      type: GraphQLInt,
    },
    marginVertical: {
      type: GraphQLInt,
    },
    marginHorizontal: {
      type: GraphQLInt,
    },
    imageHeight: {
      type: GraphQLInt,
    },
    gap: {
      type: GraphQLInt,
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
    input: SaveCarouselModuleInput,
    { auth, cardByProfileLoader }: GraphQLContext,
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
    if (!card) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    let module: CardModule | null = null;
    if (input.moduleId == null) {
      if (!input.images?.length) {
        throw new Error(ERRORS.INVALID_REQUEST);
      }
    } else {
      try {
        [module] = await getCardModulesByIds([input.moduleId]);
      } catch (e) {
        console.log(e);
        throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
      }
      if (!module || module.kind !== MODULE_KIND_CAROUSEL) {
        throw new Error(ERRORS.INVALID_REQUEST);
      }
    }

    let mediasToCreates: Array<CloudinaryResource | undefined> = [];
    let mediasToDelete: string[] = [];
    if (input.images?.length) {
      const oldMedias = ((module?.data as any)?.images as string[]) ?? [];
      const newMedias = input.images.filter(
        image => !oldMedias.includes(image),
      );
      mediasToDelete = oldMedias.filter(
        image => !input.images?.includes(image),
      );
      mediasToCreates = await getMediaInfoByPublicIds(
        newMedias.map(publicId => ({
          publicId,
          kind: 'image',
        })),
      );
    }

    const modulesData = omit(input, ['moduleId']);

    try {
      await db.transaction().execute(async trx => {
        await Promise.all(
          mediasToCreates.map(resource => {
            if (!resource) {
              throw new Error(ERRORS.INVALID_REQUEST);
            }
            return createMedia({
              id: resource.public_id,
              height: resource.height,
              width: resource.width,
              kind: 'image',
            });
          }),
        );
        if (module) {
          await updateCardModule(
            module.id,
            {
              data: { ...(module.data as object), ...modulesData },
            },
            trx,
          );
        } else {
          console.log({
            ...CAROUSEL_DEFAULT_VALUES,
            ...modulesData,
          });
          await createCardModule(
            {
              cardId: card!.id,
              kind: MODULE_KIND_CAROUSEL,
              position: await getCardModuleCount(card!.id),
              data: {
                ...CAROUSEL_DEFAULT_VALUES,
                ...modulesData,
              },
              visible: true,
            },
            trx,
          );
        }
      });
    } catch (e) {
      if (e instanceof Error && e.message === ERRORS.INVALID_REQUEST) {
        throw e;
      }
      console.log(e);
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }

    console.log(mediasToDelete);

    try {
      await deleteMediaByPublicIds(
        mediasToDelete.map(publicId => ({ publicId, kind: 'image' })),
      );
      await removeMedias(mediasToDelete);
    } catch (e) {
      console.warn('Error deleting media', e);
    }

    return { card };
  },
});

export default saveCarouselModule;
