import {
  getImageURLForSize,
  getVideoUrlForSize,
} from '@azzapp/shared/lib/imagesHelpers';
import {
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import type { Media } from '../domains/commons';
import type { GraphQLContext } from './GraphQLContext';

export const MediaGraphQL = new GraphQLObjectType<Media, GraphQLContext>({
  name: 'Media',
  description: 'User Card media module media',
  fields: () => ({
    kind: {
      type: new GraphQLNonNull(MediaKindGraphQL),
    },
    source: {
      type: new GraphQLNonNull(GraphQLString),
    },
    ratio: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
    uri: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        pixelRatio: {
          type: GraphQLFloat,
        },
        ratio: {
          type: GraphQLFloat,
        },
        width: {
          type: new GraphQLNonNull(GraphQLFloat),
        },
      },
      resolve(
        { kind, source },
        {
          pixelRatio = 1,
          ratio,
          width,
        }: { pixelRatio?: number; ratio?: number; width: number },
      ): string {
        if (kind === 'picture') {
          return getImageURLForSize(source, pixelRatio, width, ratio);
        } else {
          return getVideoUrlForSize(source, pixelRatio, width, ratio);
        }
      },
    },
  }),
});

export const MediaKindGraphQL = new GraphQLEnumType({
  name: 'MediaKind',
  values: {
    video: { value: 'video' },
    picture: { value: 'picture' },
  },
});
