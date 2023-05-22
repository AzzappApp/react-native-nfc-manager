import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLEnumType,
} from 'graphql';
import { GraphQLJSON } from 'graphql-scalars';
import MediaGraphQL, { MediaImageGraphQL } from './MediaGraphQL';
import StaticMediaGraphQL from './StaticMediaGraphQL';
import type { CardCover, Media } from '#domains';
import type { GraphQLContext } from './GraphQLContext';

const CardCoverGraphQL = new GraphQLObjectType<CardCover, GraphQLContext>({
  name: 'CardCover',
  description: 'Card cover display informations',
  fields: () => ({
    media: {
      type: new GraphQLNonNull(MediaGraphQL),
      description: 'The main media of the cover',
      resolve: (cardCover, _, { mediaLoader }): Promise<Media> =>
        mediaLoader.load(cardCover.mediaId) as Promise<Media>,
    },
    mediaStyle: {
      type: GraphQLJSON,
    },
    sourceMedia: {
      type: new GraphQLNonNull(MediaGraphQL),
      description: 'The source of the media used by the cover',
      resolve: (cardCover, _, { mediaLoader }): Promise<Media> =>
        // TODO prevent others to access to the source media
        mediaLoader.load(cardCover.sourceMediaId) as Promise<Media>,
    },
    maskMedia: {
      type: MediaImageGraphQL,
      description: 'The mask media of the cover',
      resolve: (cardCover, _, { mediaLoader }): Promise<Media | null> | null =>
        // TODO prevent others to access to the source media
        cardCover.maskMediaId ? mediaLoader.load(cardCover.maskMediaId) : null,
    },
    textPreviewMedia: {
      type: new GraphQLNonNull(MediaImageGraphQL),
      description:
        'The text of the cover renderered as an image to avoid font loading issues',
      resolve: (cardCover, _, { mediaLoader }): Promise<Media> =>
        // TODO prevent others to access to the source media
        mediaLoader.load(cardCover.textPreviewMediaId) as Promise<Media>,
    },
    background: {
      type: StaticMediaGraphQL,
      resolve({ backgroundId }, _, { staticMediaLoader }) {
        return backgroundId ? staticMediaLoader.load(backgroundId) : null;
      },
    },
    backgroundStyle: {
      type: CoverBackgroundStyleGraphQL,
    },
    foreground: {
      type: StaticMediaGraphQL,
      resolve({ foregroundId }, _, { staticMediaLoader }) {
        return foregroundId ? staticMediaLoader.load(foregroundId) : null;
      },
    },
    foregroundStyle: {
      type: CoverForegroundStyleGraphQL,
    },
    segmented: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    merged: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
    },
    titleStyle: {
      type: CardCoverTextStyleGraphQL,
    },
    subTitle: {
      type: GraphQLString,
    },
    subTitleStyle: {
      type: CardCoverTextStyleGraphQL,
    },
    contentStyle: {
      type: CoverContentStyleGraphQL,
    },
  }),
});

export default CardCoverGraphQL;

export const CoverBackgroundStyleGraphQL = new GraphQLObjectType<
  any,
  GraphQLContext
>({
  name: 'CardCoverBackgroundStyle',
  description: 'Style of the background of a card cover',
  fields: () => ({
    backgroundColor: { type: GraphQLString },
    patternColor: { type: GraphQLString },
  }),
});

export const CoverForegroundStyleGraphQL = new GraphQLObjectType<
  any,
  GraphQLContext
>({
  name: 'CardCoverForegroundStyle',
  description: 'Style of the foreground of a card cover',
  fields: () => ({
    color: { type: GraphQLString },
  }),
});

export const CoverContentStyleGraphQL = new GraphQLObjectType<
  any,
  GraphQLContext
>({
  name: 'CardCoverContentStyle',
  description: 'Style of the content of a card cover',
  fields: () => ({
    orientation: { type: CardCoverTitleOrientationGraphQL },
    placement: { type: GraphQLString }, // TODO enum
  }),
});

export const CardCoverTextStyleGraphQL = new GraphQLObjectType<
  any,
  GraphQLContext
>({
  name: 'CardCoverTextStyle',
  description: 'Style of the text in a  a card cover',
  fields: () => ({
    color: { type: GraphQLString },
    fontSize: { type: GraphQLInt },
    fontFamily: { type: GraphQLString },
  }),
});

export const CardCoverTitleOrientationGraphQL = new GraphQLEnumType({
  name: 'CardCoverTitleOrientation',
  description: 'Orientation of the title of a card cover',
  values: {
    horizontal: { value: 'horizontal' },
    topToBottom: { value: 'topToBottom' },
    bottomToTop: { value: 'bottomToTop' },
  },
});
