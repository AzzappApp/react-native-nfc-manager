import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {
  connectionFromArray,
  connectionFromArraySlice,
  cursorToOffset,
  forwardConnectionArgs,
} from 'graphql-relay';
import {
  db,
  getAllPosts,
  getAllUsersWithCard,
  getAllUsersWithCardCount,
  getFollowedUsers,
  getFollowedUsersPosts,
  getFollowedUsersPostsCount,
} from '../domains';
import {
  connectionFromDateSortedItems,
  cursorToDate,
} from '../helpers/connectionsHelpers';
import { PostConnectionGraphQL } from './PostGraphQL';
import UserGraphQL, { UserConnectionGraphQL } from './UserGraphQL';
import type { User, Viewer, Post } from '../domains';
import type { GraphQLContext } from './GraphQLContext';
import type { ConnectionArguments, Connection } from 'graphql-relay';

const ViewerGraphQL = new GraphQLObjectType<Viewer, GraphQLContext>({
  name: 'Viewer',
  description: 'Represent an Application Viewer',
  fields: () => ({
    user: {
      type: UserGraphQL,
      resolve: async (
        { isAnonymous, userId },
        _,
        { userLoader },
      ): Promise<User | null> => {
        if (isAnonymous || !userId) {
          return null;
        }
        return userLoader.load(userId);
      },
    },
    followedProfiles: {
      description:
        'Return a list of Profiles that the current user is following',
      type: new GraphQLNonNull(UserConnectionGraphQL),
      args: forwardConnectionArgs,
      resolve: async (
        viewer,
        args: ConnectionArguments,
      ): Promise<Connection<User>> => {
        if (viewer.isAnonymous || !viewer.userId) {
          return connectionFromArray([], args);
        }
        // TODO should we use pagination in database query?
        const followedUsers = await getFollowedUsers(viewer.userId);
        if (followedUsers.length > 0) {
          return connectionFromArray(followedUsers, args);
        }

        // TODO if we don't have any followed users, returns a list of recommanded users ?
        const { after, first } = args;
        const limit = first ?? 100;
        const offset = after ? cursorToOffset(after) : 0;
        return connectionFromArraySlice(
          await getAllUsersWithCard(limit, offset),
          args,
          {
            sliceStart: offset,
            arrayLength: await getAllUsersWithCardCount(),
          },
        );
      },
    },
    followedProfilesPosts: {
      description:
        'Return a list of Post that the current user is following author',
      type: new GraphQLNonNull(PostConnectionGraphQL),
      args: forwardConnectionArgs,
      resolve: async (
        viewer,
        args: ConnectionArguments,
      ): Promise<Connection<Post>> => {
        if (viewer.isAnonymous || !viewer.userId) {
          return connectionFromArray([], args);
        }
        const nbPosts = await getFollowedUsersPostsCount(viewer.userId);

        const first = args.first ?? 100;
        const offset = args.after ? cursorToDate(args.after) : null;

        const posts = nbPosts
          ? await getFollowedUsersPosts(viewer.userId, first, offset)
          : // TODO instead of returning all posts, we should return a list of recommanded posts
            await getAllPosts(first, offset);

        return connectionFromDateSortedItems(posts, {
          getDate: post => post.postDate,
          // approximations that should be good enough, and avoid a query
          hasNextPage: posts.length > 0,
          hasPreviousPage: offset !== null,
        });
      },
    },
    trendingProfiles: {
      description:
        'Return a list of User that this user might possibility be interested in (following User or promoted one)',
      type: new GraphQLNonNull(UserConnectionGraphQL),
      args: forwardConnectionArgs,
      resolve: async (
        _,
        args: ConnectionArguments,
      ): Promise<Connection<User>> => {
        // TODO dummy implementation just to test frontend
        return connectionFromArray(
          await db.selectFrom('User').selectAll().execute(),
          args,
        );
      },
    },
    trendingPosts: {
      description:
        'Return a list of tranding posts (public ?) at the time of the request',
      type: new GraphQLNonNull(PostConnectionGraphQL),
      args: forwardConnectionArgs,
      resolve: async (
        viewer,
        args: ConnectionArguments,
      ): Promise<Connection<Post>> => {
        // TODO dummy implementation just to test frontend
        return connectionFromArray(
          await db.selectFrom('Post').selectAll().execute(),
          args,
        );
      },
    },
    recommendedProfiles: {
      description:
        'Return a list of profiles the current user can be interested in',
      type: new GraphQLNonNull(UserConnectionGraphQL),
      args: forwardConnectionArgs,
      resolve: async (
        viewer,
        args: ConnectionArguments,
      ): Promise<Connection<User>> => {
        // TODO dummy implementation just to test frontend
        return connectionFromArray(
          await db.selectFrom('User').selectAll().execute(),
          args,
        );
      },
    },
    searchPosts: {
      description: 'Return a list of posts that match the search query',
      type: new GraphQLNonNull(PostConnectionGraphQL),
      args: {
        search: { type: new GraphQLNonNull(GraphQLString) },
        useLocation: { type: new GraphQLNonNull(GraphQLBoolean) },
        ...forwardConnectionArgs,
      },
      resolve: async (
        _,
        args: ConnectionArguments & { search: string; useLocation: boolean },
      ): Promise<Connection<Post>> => {
        // TODO dummy implementation just to test frontend
        return connectionFromArray(
          await db
            .selectFrom('Post')
            .selectAll()
            .where('content', 'like', `%${args.search}%`)
            .execute(),
          args,
        );
      },
    },
    searchProfiles: {
      description: 'Return a list of profiles that match the search query',
      type: new GraphQLNonNull(UserConnectionGraphQL),
      args: {
        search: { type: new GraphQLNonNull(GraphQLString) },
        useLocation: { type: new GraphQLNonNull(GraphQLBoolean) },
        ...forwardConnectionArgs,
      },
      resolve: async (
        viewer,
        args: ConnectionArguments & { search: string; useLocation: boolean },
      ): Promise<Connection<User>> => {
        // TODO dummy implementation just to test frontend
        return connectionFromArray(
          await db
            .selectFrom('User')
            .selectAll()
            .where('userName', 'like', `%${args.search}%`)
            .execute(),
          args,
        );
      },
    },
  }),
});

export default ViewerGraphQL;
