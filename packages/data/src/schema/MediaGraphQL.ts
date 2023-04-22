import {
  GraphQLFloat,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {
  getImageURLForSize,
  getVideoThumbnailURL,
  getVideoUrlForSize,
} from '@azzapp/shared/imagesHelpers';
import type { Media } from '#domains';
import type { GraphQLContext } from './GraphQLContext';

const MediaGraphQL = new GraphQLInterfaceType({
  name: 'Media',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    aspectRatio: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
    width: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
    height: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
    uri: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        pixelRatio: {
          type: GraphQLFloat,
        },
        height: {
          type: GraphQLFloat,
        },
        width: {
          type: GraphQLFloat,
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
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    aspectRatio: {
      type: new GraphQLNonNull(GraphQLFloat),
      resolve({ width, height }) {
        return width / height;
      },
    },
    width: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
    height: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
    uri: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        pixelRatio: {
          type: GraphQLFloat,
        },
        height: {
          type: GraphQLFloat,
        },
        width: {
          type: GraphQLFloat,
        },
      },
      resolve(
        { id },
        {
          pixelRatio = 1,
          height,
          width,
        }: {
          pixelRatio?: number;
          height?: number;
          width?: number;
        },
      ): string {
        return getVideoUrlForSize(id, width, height, pixelRatio);
      },
    },
    thumbnail: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        pixelRatio: {
          type: GraphQLFloat,
        },
        height: {
          type: GraphQLFloat,
        },
        width: {
          type: GraphQLFloat,
        },
        time: {
          type: GraphQLFloat,
        },
      },
      resolve(
        { id },
        {
          pixelRatio = 1,
          height,
          width,
        }: {
          pixelRatio?: number;
          height?: number;
          width: number;
        },
      ): string {
        return getVideoThumbnailURL(id, width, height, pixelRatio);
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
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    aspectRatio: {
      type: new GraphQLNonNull(GraphQLFloat),
      resolve({ width, height }) {
        return width / height;
      },
    },
    width: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
    height: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
    uri: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        pixelRatio: {
          type: GraphQLFloat,
        },
        height: {
          type: GraphQLFloat,
        },
        width: {
          type: GraphQLFloat,
        },
      },
      resolve(
        { id },
        {
          pixelRatio = 1,
          height,
          width,
        }: {
          pixelRatio?: number;
          height?: number;
          width?: number;
          thumbnail?: boolean;
        },
      ): string {
        return getImageURLForSize(id, width, height, pixelRatio);
      },
    },
  }),
});
