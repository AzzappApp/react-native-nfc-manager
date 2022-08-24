import {
  getImageURLForSize,
  getVideoThumbnailURL,
  getVideoUrlForSize,
} from '@azzapp/shared/lib/imagesHelpers';
import {
  GraphQLBoolean,
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
        thumbnail: {
          type: GraphQLBoolean,
        },
      },
      resolve(
        { kind, source },
        {
          pixelRatio = 1,
          ratio,
          width,
          thumbnail,
        }: {
          pixelRatio?: number;
          ratio?: number;
          width: number;
          thumbnail?: boolean;
        },
      ): string {
        if (kind === 'picture') {
          return getImageURLForSize(source, width, pixelRatio, ratio);
        } else if (thumbnail) {
          return getVideoThumbnailURL(source, width, pixelRatio, ratio);
        } else {
          return getVideoUrlForSize(source, width, pixelRatio, ratio);
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
