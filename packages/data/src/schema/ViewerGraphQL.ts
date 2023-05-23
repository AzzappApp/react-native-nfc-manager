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
import { getProfileId } from '@azzapp/auth/viewer';
import {
  db,
  getAllPosts,
  getAllProfilesWithCard,
  getAllProfilesWithCardCount,
  getStaticMediasByUsage,
  getCoverTemplatesByKind,
  getCoverTemplatesSuggestion,
  getFollowedProfiles,
  getFollowedProfilesPosts,
  getFollowedProfilesPostsCount,
} from '#domains';
import {
  connectionFromDateSortedItems,
  cursorToDate,
} from '#helpers/connectionsHelpers';
import CoverTemplateGraphQL from './CoverTemplateGraphQL';
import { PostConnectionGraphQL } from './PostGraphQL';
import ProfileGraphQL, { ProfileConnectionGraphQL } from './ProfileGraphQL';
import StaticMediaGraphQL from './StaticMediaGraphQL';
import type { Post, Profile, CoverTemplate } from '#domains';
import type { GraphQLContext } from './GraphQLContext';
import type { Viewer } from '@azzapp/auth/viewer';
import type { Prisma } from '@prisma/client';
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
        const profileId = getProfileId(viewer);
        if (!profileId) {
          return null;
        }
        return profileLoader.load(profileId);
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
        const profileId = getProfileId(viewer);
        if (!profileId) {
          return connectionFromArray([], args);
        }
        // TODO should we use pagination in database query?
        const followedProfiles = await getFollowedProfiles(profileId);
        if (followedProfiles.length > 0) {
          return connectionFromArray(followedProfiles, args);
        }

        // TODO if we don't have any followed users, returns a list of recommanded users ?
        const { after, first } = args;
        const limit = first ?? 100;
        const offset = after ? cursorToOffset(after) : 0;
        return connectionFromArraySlice(
          await getAllProfilesWithCard(limit, offset, [profileId]),
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
        const profileId = getProfileId(viewer);
        if (!profileId) {
          return connectionFromArray([], args);
        }
        const nbPosts = await getFollowedProfilesPostsCount(profileId);

        const first = args.first ?? 100;
        const offset = args.after ? cursorToDate(args.after) : null;

        const posts = nbPosts
          ? await getFollowedProfilesPosts(profileId, first, offset)
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
        new GraphQLList(new GraphQLNonNull(StaticMediaGraphQL)),
      ),
      resolve: async () => getStaticMediasByUsage('coverBackground'),
    },
    coverForegrounds: {
      description: 'Return a list of cover foregrounds',
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(StaticMediaGraphQL)),
      ),
      resolve: async () => getStaticMediasByUsage('coverForeground'),
    },
    moduleBackgrounds: {
      description: 'Return a list of module backgrounds',
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(StaticMediaGraphQL)),
      ),
      resolve: async () => getStaticMediasByUsage('moduleBackground'),
    },
    coverTemplates: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(CoverTemplateGraphQL)),
      ),
      description: 'Fetches all cover templates for a given kind',
      resolve: async (
        viewer,
        _,
        { profileLoader },
      ): Promise<CoverTemplate[]> => {
        const profileId = getProfileId(viewer);
        if (!profileId) {
          return [];
        }
        const profile = await profileLoader.load(profileId);
        return getCoverTemplatesByKind(profile?.profileKind ?? 'personal');
      },
    },
    coverTemplatesByCategory: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(CoverTemplateCategoryGraphQL)),
      ),
      args: {
        segmented: { type: GraphQLBoolean },
      },
      description:
        'Fetches all cover templates for a given kind ordered by Category',
      resolve: async (
        viewer,
        { segmented }: { segmented: boolean },
        { profileLoader, cardLoader },
      ): Promise<CoverTemplateCategory[]> => {
        const profileId = getProfileId(viewer);
        if (!profileId) {
          return [];
        }
        const profile = await profileLoader.load(profileId);

        let determinedSegmented = segmented;
        if (segmented == null) {
          // we need to determine which segmented value to use in order to  avoid to mulitple subsequent calls from client while loading the page
          const card = await cardLoader.load(profileId);
          if (card?.coverId == null) {
            determinedSegmented = profile?.profileKind === 'personal';
          }
        }

        const templates = await getCoverTemplatesByKind(
          profile?.profileKind ?? 'personal',
          determinedSegmented,
        );

        const categories: CoverTemplateCategory[] = [];
        // TODO refactor this, this is a mess, we should not use the en label as a group by ...
        templates.forEach(template => {
          const category = (template.category as Prisma.JsonObject)
            ?.en as string; //strong typing cames from the prisma documentation

          if (category) {
            // find object in categories array with category name === category
            const existingCategory = categories.find(
              categoryItem => categoryItem.category === category,
            );

            if (existingCategory) {
              existingCategory.templates.push(template);
            } else {
              categories.push({
                category,
                templates: [template],
              });
            }
          }
        });
        return categories;
      },
    },
    coverTemplatesSuggestion: {
      type: new GraphQLNonNull(new GraphQLList(CoverTemplateGraphQL)),
      description: 'Return Suggested Cover Templates for business profile',
      resolve: async (
        viewer,
        _,
        { profileLoader },
      ): Promise<Array<CoverTemplate | null>> => {
        const profileId = getProfileId(viewer);
        if (!profileId) {
          return [];
        }
        const profile = await profileLoader.load(profileId);
        if (profile?.profileKind !== 'business') return [];
        return getCoverTemplatesSuggestion(profile.companyActivityId!);
      },
    },
  }),
});

export default ViewerGraphQL;

type CoverTemplateCategory = {
  category: string;
  templates: CoverTemplate[];
};

/* create the GraphQLObjectType for CoverTempalteByCategory});*/
const CoverTemplateCategoryGraphQL = new GraphQLObjectType({
  name: 'CoverTemplateCategory',
  description: 'A cover template by category',
  fields: () => ({
    category: {
      description: 'The category name',
      type: new GraphQLNonNull(GraphQLString),
    },
    templates: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(CoverTemplateGraphQL)),
      ),
      description: 'The category templates',
    },
  }),
});
