import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
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
    followedProfiles: {
      description:
        'Return a list of Profiles that the current user is following',
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
    followedProfilesPosts: {
      description:
        'Return a list of Post that the current user is following author',
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
    trendingProfiles: {
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

    searchPosts: {
      description: 'Return a list of posts that match the search query',
      type: new GraphQLNonNull(PostConnectionGraphQL),
      args: {
        search: { type: new GraphQLNonNull(GraphQLString) },
        useLocation: { type: new GraphQLNonNull(GraphQLBoolean) },
        ...forwardConnectionArgs,
      },
      resolve: async (
        viewer,
        args: ConnectionArguments & { search: string; useLocation: boolean },
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
            result.push(
              ...rows.map(({ doc }) => {
                console.log(doc);
                return doc;
              }),
            );
          }
        }
        result.push(...(await getAllPosts()));
        return connectionFromArray(
          uniqWith(result, (a, b) => a.postId === b.postId),
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
    //     searchPosts(first: Float!, after: String, search: String , useLocation: Boolean):PostConnection
    //  searchProfiles(first: Float!, after: String, search: String , useLocation: Boolean):ProfileConnection
  }),
});

export default ViewerGraphQL;
