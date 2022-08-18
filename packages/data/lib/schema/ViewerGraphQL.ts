import { GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { connectionFromArray, forwardConnectionArgs } from 'graphql-relay';
import { uniqWith } from 'lodash';
import { getUserFollowingIds } from '../domains/Followers';
import { getAllPosts, getUsersPosts } from '../domains/Post';
import { getAllUsers, getUserById, getUsersByIds } from '../domains/User';
import { PostConnectionGraphQL } from './PostGraphQL';
import UserGraphQL, { UserConnectionGraphQL } from './UserGraphQL';
import type { Post } from '../domains/Post';
import type { User } from '../domains/User';
import type { ConnectionArguments, Connection } from 'graphql-relay';

const ViewerGraphQL = new GraphQLObjectType<{
  userId?: string | null;
  isAnonymous: boolean;
}>({
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
        'Return a list of User that this user might possibility be interested in (following User or promoted one)',
      type: new GraphQLNonNull(UserConnectionGraphQL),
      args: forwardConnectionArgs,
      resolve: async (
        viewer,
        args: ConnectionArguments,
      ): Promise<Connection<User>> => {
        // TODO dummy implementation just to test frontend
        const result: User[] = [];
        if (!viewer.isAnonymous && viewer.userId) {
          const followingIds = await getUserFollowingIds(viewer.userId);
          if (followingIds.length) {
            const followings = await getUsersByIds(followingIds);
            const map = new Map<string, User>();
            followings.forEach(user => map.set(user.id, user));
            result.push(...followingIds.map(id => map.get(id)!));
          }
        }
        result.push(...(await getAllUsers()));
        return connectionFromArray(
          uniqWith(result, (a, b) => a.id === b.id).filter(
            ({ id }) => id !== viewer.userId,
          ),
          args,
        );
      },
    },
    recommandedPosts: {
      description:
        'Return a list of Post that this user might possibility be interested in (following User post or promoted one)',
      type: new GraphQLNonNull(PostConnectionGraphQL),
      args: forwardConnectionArgs,
      resolve: async (
        viewer,
        args: ConnectionArguments,
      ): Promise<Connection<Post>> => {
        // TODO dummy implementation just to test frontend
        const result: Post[] = [];
        if (!viewer.isAnonymous && viewer.userId) {
          const followingIds = await getUserFollowingIds(viewer.userId);
          if (followingIds.length) {
            const { rows } = await getUsersPosts(
              followingIds,
              10000,
              args.after,
            );
            result.push(...rows.map(({ doc }) => doc));
          }
        }
        result.push(...(await getAllPosts()));
        return connectionFromArray(
          uniqWith(result, (a, b) => a.postId === b.postId),
          args,
        );
      },
    },
  }),
});

export default ViewerGraphQL;
