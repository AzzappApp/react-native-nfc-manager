/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
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
import CardGraphQL from '#schema/CardGraphQL';
import {
  ItemMarginGraphQL,
  HorizontalArrangementGraphQL,
  VerticalArrangementGraphQL,
} from '#schema/CardModuleGraphql';
import { TextAlignmentGraphQL } from '#schema/commonsTypes';
import { ModuleBackgroundStyleInputGraphQL } from './commonsInputTypes';
import type { Card, CardModule } from '#domains';
import type { GraphQLContext } from '../GraphQLContext';
import type { CloudinaryResource } from '@azzapp/shared/cloudinaryHelpers';

type SavePhotoWithTextAndTitleModuleInput = Partial<{
  moduleId: string;
  image: string;
  fontFamily: string;
  fontColor: string;
  textAlign: 'center' | 'justify' | 'left' | 'right';
  imageMargin: 'width_full' | 'width_limited';
  arrangement: 'left' | 'right';
  verticalArrangement: 'bottom' | 'top';
  gap: number;
  fontSize: number;
  textSize: number;
  borderRadius: number;
  marginHorizontal: number;
  marginVertical: number;
  backgroundId: string;
  verticalSpacing: number;
  aspectRatio: number;
  text: string;
  title: string;
  backgroundStyle: {
    backgroundColor: string;
    patternColor: string;
    opacity: number;
  };
}>;

const savePhotoWithTextAndTitleModule = mutationWithClientMutationId({
  name: 'SavePhotoWithTextAndTitleModule',
  inputFields: () => ({
    moduleId: {
      type: GraphQLID,
    },
    image: {
      type: new GraphQLNonNull(GraphQLString),
    },
    text: {
      type: GraphQLString,
    },
    title: {
      type: GraphQLString,
    },
    fontFamily: {
      type: GraphQLString,
    },
    fontColor: {
      type: GraphQLString,
    },
    textAlign: {
      type: TextAlignmentGraphQL,
    },
    imageMargin: {
      type: ItemMarginGraphQL,
    },
    horizontalArrangement: {
      type: HorizontalArrangementGraphQL,
    },
    verticalArrangement: {
      type: VerticalArrangementGraphQL,
    },
    gap: {
      type: GraphQLInt,
    },
    fontSize: {
      type: GraphQLInt,
    },
    textSize: {
      type: GraphQLInt,
    },
    borderRadius: {
      type: GraphQLInt,
    },
    marginHorizontal: {
      type: GraphQLInt,
    },
    marginVertical: {
      type: GraphQLInt,
    },
    verticalSpacing: {
      type: GraphQLInt,
    },
    aspectRatio: {
      type: GraphQLFloat,
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
    input: SavePhotoWithTextAndTitleModuleInput,
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
        console.log(e);
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
        mediaLoader.clear(input.image!);
        await removeMedias([(module?.data as any)?.image]);
      }

      return { card };
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
  },
});

export default savePhotoWithTextAndTitleModule;
