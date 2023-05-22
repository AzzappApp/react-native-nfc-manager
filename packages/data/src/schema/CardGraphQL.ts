import { GraphQLList, GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { globalIdField } from 'graphql-relay';
import { getProfileId } from '@azzapp/auth/viewer';
import { getCardModules } from '#domains';
import CardCoverGraphQL from './CardCoverGraphQL';
import CardModuleGraphQL from './CardModuleGraphql';
import NodeGraphQL from './NodeGraphQL';
import UserGraphQL from './ProfileGraphQL';
import type { Card, CardModule } from '#domains';
import type { GraphQLContext } from './GraphQLContext';

const CardGraphQL = new GraphQLObjectType<Card, GraphQLContext>({
  name: 'Card',
  description: 'An azzapp User card',
  interfaces: [NodeGraphQL],
  fields: () => ({
    id: globalIdField('Card'),
    user: {
      type: new GraphQLNonNull(UserGraphQL),
      // TODO handle null case ?
      resolve: (card, _, { profileLoader }) =>
        profileLoader.load(card.profileId),
    },
    cover: {
      type: new GraphQLNonNull(CardCoverGraphQL),
      description: 'Card cover display informations',
      resolve: (card, _, { coverLoader }) => coverLoader.load(card.coverId),
    },
    modules: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(CardModuleGraphQL)),
      ),
      description: 'Definitions of the cards modules',
      resolve: ({ id, profileId }, _, { auth }): Promise<CardModule[]> => {
        return getCardModules(id, profileId === getProfileId(auth));
      },
    },
  }),
});

export default CardGraphQL;
