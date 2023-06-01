/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLString } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { omit } from 'lodash';
import { getProfileId } from '@azzapp/auth/viewer';
import {
  SIMPLE_BUTTON_DEFAULT_VALUES,
  MODULE_KIND_SIMPLE_BUTTON,
} from '@azzapp/shared/cardModuleHelpers';
import ERRORS from '@azzapp/shared/errors';
import {
  createCardModule,
  getCardModuleCount,
  getCardModulesByIds,
  updateCardModule,
} from '#domains';
import CardGraphQL from '#schema/CardGraphQL';
import { ModuleBackgroundStyleInputGraphQL } from './commonsInputTypes';
import type { Card, CardModule } from '#domains';
import type { GraphQLContext } from '../GraphQLContext';

type SaveSimpleButtonModuleInput = Partial<{
  moduleId: string;
  buttonLabel: string;
  actionType: string;
  actionLink: string;
  fontFamily: string;
  fontColor: string;
  fontSize: number;
  buttonColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  marginTop: number;
  marginBottom: number;
  width: number;
  height: number;
  backgroundId: string;
  backgroundStyle: {
    backgroundColor: string;
    patternColor: string;
    opacity: number;
  };
}>;

const saveSimpleButtonModule = mutationWithClientMutationId({
  name: 'SaveSimpleButtonModule',
  inputFields: () => ({
    moduleId: {
      type: GraphQLID,
    },
    buttonLabel: {
      type: GraphQLString,
    },
    actionType: {
      type: GraphQLString,
    },
    actionLink: {
      type: GraphQLString,
    },
    fontFamily: {
      type: GraphQLString,
    },
    fontColor: {
      type: GraphQLString,
    },
    fontSize: {
      type: GraphQLInt,
    },
    buttonColor: {
      type: GraphQLString,
    },
    borderColor: {
      type: GraphQLString,
    },
    borderWidth: {
      type: GraphQLInt,
    },
    borderRadius: {
      type: GraphQLInt,
    },
    marginTop: {
      type: GraphQLInt,
    },
    marginBottom: {
      type: GraphQLInt,
    },
    width: {
      type: GraphQLInt,
    },
    height: {
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
    input: SaveSimpleButtonModuleInput,
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
          kind: MODULE_KIND_SIMPLE_BUTTON,
          position: await getCardModuleCount(card.id),
          data: {
            ...SIMPLE_BUTTON_DEFAULT_VALUES,
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

export default saveSimpleButtonModule;
