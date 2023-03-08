import {
  GraphQLBoolean,
  GraphQLList,
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
  getAllProfilesWithCard,
  getAllProfilesWithCardCount,
  getCoverLayers,
  getFollowedProfiles,
  getFollowedProfilesPosts,
  getFollowedProfilesPostsCount,
} from '#domains';
import {
  connectionFromDateSortedItems,
  cursorToDate,
} from '#helpers/connectionsHelpers';
import { CoverLayerGraphQL } from './CardGraphQL';
import { PostConnectionGraphQL } from './PostGraphQL';
import ProfileGraphQL, { ProfileConnectionGraphQL } from './ProfileGraphQL';
import type { Post, Profile } from '#domains';
import type { GraphQLContext } from './GraphQLContext';
import type { Viewer } from '@azzapp/auth/viewer';
import type { ConnectionArguments, Connection } from 'graphql-relay';

const ViewerGraphQL = new GraphQLObjectType<Viewer, GraphQLContext>({
  name: 'Viewer',
  description: 'Represent an Application Viewer',
  fields: () => ({
    profile: {
      type: ProfileGraphQL,
      resolve: async (
        viewer,
        _,
        { profileLoader },
      ): Promise<Profile | null> => {
        if (viewer.isAnonymous) {
          return null;
        }
        return profileLoader.load(viewer.profileId);
      },
    },
    followedProfiles: {
      description:
        'Return a list of Profiles that the current user is following',
      type: new GraphQLNonNull(ProfileConnectionGraphQL),
      args: forwardConnectionArgs,
      resolve: async (
        viewer,
        args: ConnectionArguments,
      ): Promise<Connection<Profile>> => {
        if (viewer.isAnonymous) {
          return connectionFromArray([], args);
        }
        // TODO should we use pagination in database query?
        const followedProfiles = await getFollowedProfiles(viewer.profileId);
        if (followedProfiles.length > 0) {
          return connectionFromArray(followedProfiles, args);
        }

        // TODO if we don't have any followed users, returns a list of recommanded users ?
        const { after, first } = args;
        const limit = first ?? 100;
        const offset = after ? cursorToOffset(after) : 0;
        return connectionFromArraySlice(
          await getAllProfilesWithCard(limit, offset, [viewer.profileId]),
          args,
          {
            sliceStart: offset,
            arrayLength: await getAllProfilesWithCardCount(),
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
        if (viewer.isAnonymous) {
          return connectionFromArray([], args);
        }
        const nbPosts = await getFollowedProfilesPostsCount(viewer.profileId);

        const first = args.first ?? 100;
        const offset = args.after ? cursorToDate(args.after) : null;

        const posts = nbPosts
          ? await getFollowedProfilesPosts(viewer.profileId, first, offset)
          : // TODO instead of returning all posts, we should return a list of recommanded posts
            await getAllPosts(first, offset);

        return connectionFromDateSortedItems(posts, {
          getDate: post => post.createdAt,
          // approximations that should be good enough, and avoid a query
          hasNextPage: posts.length > 0,
          hasPreviousPage: offset !== null,
        });
      },
    },
    trendingProfiles: {
      description:
        'Return a list of Profile that this user might possibility be interested in (following Profile or promoted one)',
      type: new GraphQLNonNull(ProfileConnectionGraphQL),
      args: forwardConnectionArgs,
      resolve: async (
        _,
        args: ConnectionArguments,
      ): Promise<Connection<Profile>> => {
        // TODO dummy implementation just to test frontend
        return connectionFromArray(
          await db.selectFrom('Profile').selectAll().execute(),
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
      type: new GraphQLNonNull(ProfileConnectionGraphQL),
      args: forwardConnectionArgs,
      resolve: async (
        viewer,
        args: ConnectionArguments,
      ): Promise<Connection<Profile>> => {
        // TODO dummy implementation just to test frontend
        return connectionFromArray(
          await db.selectFrom('Profile').selectAll().execute(),
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
      type: new GraphQLNonNull(ProfileConnectionGraphQL),
      args: {
        search: { type: new GraphQLNonNull(GraphQLString) },
        useLocation: { type: new GraphQLNonNull(GraphQLBoolean) },
        ...forwardConnectionArgs,
      },
      resolve: async (
        viewer,
        args: ConnectionArguments & { search: string; useLocation: boolean },
      ): Promise<Connection<Profile>> => {
        // TODO dummy implementation just to test frontend
        return connectionFromArray(
          await db
            .selectFrom('Profile')
            .selectAll()
            .where('userName', 'like', `%${args.search}%`)
            .execute(),
          args,
        );
      },
    },
    coverBackgrounds: {
      description: 'Return a list of cover backgrounds',
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(CoverLayerGraphQL)),
      ),
      resolve: async () => getCoverLayers('background'),
    },
    coverForegrounds: {
      description: 'Return a list of cover foregrounds',
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(CoverLayerGraphQL)),
      ),
      resolve: async () => getCoverLayers('foreground'),
    },
  }),
});

export default ViewerGraphQL;
