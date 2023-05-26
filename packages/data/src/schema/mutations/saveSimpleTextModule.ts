/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLString } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { omit } from 'lodash';
import { getProfileId } from '@azzapp/auth/viewer';
import {
  MODULE_KIND_SIMPLE_TEXT,
  MODULE_KIND_SIMPLE_TITLE,
  SIMPLE_TEXT_DEFAULT_VALUES,
  SIMPLE_TITLE_DEFAULT_VALUES,
} from '@azzapp/shared/cardModuleHelpers';
import ERRORS from '@azzapp/shared/errors';
import {
  createCardModule,
  getCardModuleCount,
  getCardModulesByIds,
  updateCardModule,
} from '#domains';
import CardGraphQL from '#schema/CardGraphQL';
import { TextAlignmentGraphQL } from '#schema/commonsTypes';
import { ModuleBackgroundStyleInputGraphQL } from './commonsInputTypes';
import type { Card, CardModule } from '#domains';
import type { GraphQLContext } from '../GraphQLContext';

type SaveSimpleTextModuleInput = Partial<{
  moduleId: string;
  kind: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  verticalSpacing: number;
  textAlign: 'center' | 'justify' | 'left' | 'right';
  marginHorizontal: number;
  marginVertical: number;
  backgroundId: string;
  backgroundStyle: {
    backgroundColor: string;
    patternColor: string;
    opacity: number;
  };
}>;

const saveSimpleTextModule = mutationWithClientMutationId({
  name: 'SaveSimpleTextModule',
  inputFields: () => ({
    moduleId: {
      type: GraphQLID,
    },
    kind: {
      type: new GraphQLNonNull(GraphQLString),
    },
    text: {
      type: GraphQLString,
    },
    fontFamily: {
      type: GraphQLString,
    },
    fontSize: {
      type: GraphQLInt,
    },
    color: {
      type: GraphQLString,
    },
    verticalSpacing: {
      type: GraphQLInt,
    },
    textAlign: {
      type: TextAlignmentGraphQL,
    },
    marginHorizontal: {
      type: GraphQLInt,
    },
    marginVertical: {
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
    input: SaveSimpleTextModuleInput,
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
    if (
      input.kind !== MODULE_KIND_SIMPLE_TEXT &&
      input.kind !== MODULE_KIND_SIMPLE_TITLE
    ) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    let module: CardModule | null = null;
    if (input.moduleId == null) {
      if (!input.text) {
        throw new Error(ERRORS.INVALID_REQUEST);
      }
    } else {
      try {
        [module] = await getCardModulesByIds([input.moduleId]);
      } catch (e) {
        console.log(e);
        throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
      }
      if (!module || module.kind !== input.kind || module.cardId !== card.id) {
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
          kind: input.kind,
          position: await getCardModuleCount(card.id),
          data: {
            ...(input.kind === 'simpleText'
              ? SIMPLE_TEXT_DEFAULT_VALUES
              : SIMPLE_TITLE_DEFAULT_VALUES),
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

export default saveSimpleTextModule;
