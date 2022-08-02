import { GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { forwardConnectionArgs } from 'graphql-relay';
import { getUserById } from '../domains/User';
import { getRecommandedUsers } from '../domains/Viewer';
import {
  emptyConnection,
  forwardConnectionFromBookmarkedListResult,
} from '../helpers/graphqlHelpers';
import UserGraphQL, { UserConnectionGraphQL } from './UserGraphQL';
import type { User } from '../domains/User';
import type { Viewer } from '../domains/Viewer';
import type { ConnectionArguments, Connection } from 'graphql-relay';

const ViewerGraphQL = new GraphQLObjectType<Viewer>({
  name: 'Viewer',
  description: 'Represent an Application Viewer',
  fields: () => ({
    user: {
      type: UserGraphQL,
      resolve: viewer =>
        viewer.isAnonymous ? null : getUserById(viewer.userId!),
    },
    recommandedUsers: {
      description:
        'Return a list of User that this user might possibility be interested in (followed User or promoted one)',
      type: new GraphQLNonNull(UserConnectionGraphQL),
      args: forwardConnectionArgs,
      resolve: async (
        viewer,
        args: ConnectionArguments,
      ): Promise<Connection<User>> => {
        const limit = args.first ?? 10;
        const result = await getRecommandedUsers(viewer, limit, args.after);
        if (result) {
          return forwardConnectionFromBookmarkedListResult(limit, result);
        }
        return emptyConnection;
      },
    },
  }),
});

export default ViewerGraphQL;
