import {
  getImageURLForSize,
  getVideoThumbnailURL,
  getVideoUrlForSize,
} from '@azzapp/shared/lib/imagesHelpers';
import {
  GraphQLFloat,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import type { Media } from '../domains';
import type { GraphQLContext } from './GraphQLContext';

const MediaGraphQL = new GraphQLInterfaceType({
  name: 'Media',
  fields: () => ({
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
    },
  }),
});

export default MediaGraphQL;

export const MediaVideoGraphql = new GraphQLObjectType<Media, GraphQLContext>({
  name: 'MediaVideo',
  description: 'A video media',
  interfaces: [MediaGraphQL],
  isTypeOf: media => media.kind === 'video',
  fields: () => ({
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
        { source },
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
        if (thumbnail) {
          return getVideoThumbnailURL(source, width, pixelRatio, ratio);
        } else {
          return getVideoUrlForSize(source, width, pixelRatio, ratio);
        }
      },
    },
    thumbnail: {
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
        time: {
          type: GraphQLFloat,
        },
      },
      resolve(
        { source },
        {
          pixelRatio = 1,
          ratio,
          width,
        }: {
          pixelRatio?: number;
          ratio?: number;
          width: number;
        },
      ): string {
        return getVideoThumbnailURL(source, width, pixelRatio, ratio);
      },
    },
  }),
});

export const MediaImageGraphQL = new GraphQLObjectType<Media, GraphQLContext>({
  name: 'MediaImage',
  description: 'An image media',
  interfaces: [MediaGraphQL],
  isTypeOf: media => media.kind === 'image',
  fields: () => ({
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
        { source },
        {
          pixelRatio = 1,
          ratio,
          width,
        }: {
          pixelRatio?: number;
          ratio?: number;
          width: number;
          thumbnail?: boolean;
        },
      ): string {
        return getImageURLForSize(source, width, pixelRatio, ratio);
      },
    },
  }),
});
