import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { getImageURLForSize } from '@azzapp/shared/imagesHelpers';
import type { StaticMedia } from '#domains';
import type { GraphQLContext } from './GraphQLContext';

const StaticMediaGraphQL = new GraphQLObjectType<StaticMedia, GraphQLContext>({
  name: 'StaticMedia',
  description: 'Media used in web card edition provided by azzapp',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    uri: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        width: { type: GraphQLInt },
        pixelRatio: { type: GraphQLInt },
      },
      resolve(
        { id },
        { width, pixelRatio }: { width?: number; pixelRatio?: number },
      ): string {
        return getImageURLForSize(id, width, undefined, pixelRatio);
      },
    },
    name: { type: GraphQLString },
    usage: { type: new GraphQLNonNull(StaticMediaUsageGraphQL) },
    tags: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString)),
      ),
      resolve({ tags }) {
        return tags?.split(',') ?? [];
      },
    },
  }),
});
export default StaticMediaGraphQL;

export const StaticMediaUsageGraphQL = new GraphQLEnumType({
  name: 'StaticMediaUsage',
  values: {
    coverBackground: { value: 'coverBackground' },
    coverForeground: { value: 'coverForeground' },
    moduleBackground: { value: 'moduleBackground' },
  },
});
