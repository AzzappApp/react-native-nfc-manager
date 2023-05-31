/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLString } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { omit } from 'lodash';
import { getProfileId } from '@azzapp/auth/viewer';
import { LINE_DIVIDER_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import ERRORS from '@azzapp/shared/errors';
import {
  createCardModule,
  getCardModuleCount,
  getCardModulesByIds,
  updateCardModule,
} from '#domains';
import CardGraphQL from '#schema/CardGraphQL';
import { LineDividerOrientationGraphQL } from '#schema/CardModuleGraphql';
import type { Card, CardModule } from '#domains';
import type { GraphQLContext } from '../GraphQLContext';

type SaveLineDividerModuleInput = Partial<{
  moduleId: string;
  kind: string;
  orientation: string;
  marginBottom: number;
  marginTop: number;
  height: number;
  colorTop: number;
  colorBottom: number;
}>;

const saveLineDividerModule = mutationWithClientMutationId({
  name: 'SaveLineDividerModule',
  inputFields: () => ({
    moduleId: {
      type: GraphQLID,
    },
    orientation: {
      type: LineDividerOrientationGraphQL,
    },
    marginTop: {
      type: GraphQLInt,
    },
    marginBottom: {
      type: GraphQLInt,
    },
    height: {
      type: GraphQLInt,
    },
    colorTop: {
      type: GraphQLString,
    },
    colorBottom: {
      type: GraphQLString,
    },
  }),
  outputFields: {
    card: {
      type: new GraphQLNonNull(CardGraphQL),
    },
  },
  mutateAndGetPayload: async (
    input: SaveLineDividerModuleInput,
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

    try {
      if (module) {
        await updateCardModule(module.id, {
          data: { ...(module.data as object), ...omit(input, 'moduleId') },
        });
      } else {
        await createCardModule({
          cardId: card.id,
          kind: 'lineDivider',
          position: await getCardModuleCount(card.id),
          data: {
            ...LINE_DIVIDER_DEFAULT_VALUES,
            ...omit(input, 'moduleId'),
          },
          visible: true,
        });
      }
    } catch (e) {
      console.log(e);
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }

    return { card };
  },
});

export default saveLineDividerModule;
