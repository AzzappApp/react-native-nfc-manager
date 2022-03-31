import { GraphQLObjectType, GraphQLString } from 'graphql';
import { connectionDefinitions, globalIdField } from 'graphql-relay';
import { getUserMainUserCard } from '../domains/UserCard';
import NodeGraphQL from './NodeGraphQL';
import UserCardGraphQL from './UserCardGraphQL';
import type { User } from '../domains/User';
import type { GraphQLContext } from './GraphQLContext';

const UserGraphQL: GraphQLObjectType = new GraphQLObjectType<
  User,
  GraphQLContext
>({
  name: 'User',
  description: 'Represent an Azzapp User',
  interfaces: [NodeGraphQL],
  fields: () => ({
    id: globalIdField('User'),
    firstName: {
      type: GraphQLString,
    },
    lastName: {
      type: GraphQLString,
    },
    card: {
      type: UserCardGraphQL,
      resolve: user => getUserMainUserCard(user.id),
    },
  }),
});

export const { connectionType: UserConnectionGraphQL } = connectionDefinitions({
  nodeType: UserGraphQL,
});

export default UserGraphQL;
