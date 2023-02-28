import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLEnumType,
  GraphQLID,
} from 'graphql';
import { globalIdField } from 'graphql-relay';
import { GraphQLJSON } from 'graphql-scalars';
import { getImageURLForSize } from '@azzapp/shared/imagesHelpers';
import { getCardModules, getCoverLayerById } from '#domains';
import MediaGraphQL, { MediaImageGraphQL } from './MediaGraphQL';
import NodeGraphQL from './NodeGraphQL';
import UserGraphQL from './ProfileGraphQL';
import type { Card, CardCover, Media, CardModule, CoverLayer } from '#domains';
import type { GraphQLContext } from './GraphQLContext';

const CardGraphQL = new GraphQLObjectType<Card, GraphQLContext>({
  name: 'Card',
  description: 'An azzapp User card',
  interfaces: [NodeGraphQL],
  fields: () => ({
    id: globalIdField('Card'),
    user: {
      type: new GraphQLNonNull(UserGraphQL),
      // TODO handle null case ?
      resolve: (card, _, { profileLoader }) =>
        profileLoader.load(card.profileId),
    },
    cover: {
      type: new GraphQLNonNull(CardCoverGraphQL),
      description: 'Card cover display informations',
      resolve: (card, _, { coverLoader }) => coverLoader.load(card.coverId),
    },
    modules: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(CardModuleGraphQL)),
      ),
      description: 'Definitions of the cards modules',
      resolve: ({ id }): Promise<CardModule[]> => getCardModules(id),
    },
  }),
});

export default CardGraphQL;

export const CardCoverGraphQL = new GraphQLObjectType<
  CardCover,
  GraphQLContext
>({
  name: 'CardCover',
  description: 'Card cover display informations',
  fields: () => ({
    media: {
      type: new GraphQLNonNull(MediaImageGraphQL),
      description: 'The main media of the cover',
      resolve: (cardCover, _, { mediaLoader }): Promise<Media> =>
        mediaLoader.load(cardCover.mediaId) as Promise<Media>,
    },
    mediaStyle: {
      type: GraphQLJSON,
    },
    sourceMedia: {
      type: new GraphQLNonNull(MediaImageGraphQL),
      description: 'The source of the media used by the cover',
      resolve: (cardCover, _, { mediaLoader }): Promise<Media> =>
        // TODO prevent others to access to the source media
        mediaLoader.load(cardCover.sourceMediaId) as Promise<Media>,
    },
    maskMedia: {
      type: new GraphQLNonNull(MediaImageGraphQL),
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
      type: CoverLayerGraphQL,
      resolve({ backgroundId }) {
        return backgroundId ? getCoverLayerById(backgroundId) : null;
      },
    },
    backgroundStyle: {
      type: CoverBackgroundStyleGraphQL,
    },
    foreground: {
      type: CoverLayerGraphQL,
      resolve({ foregroundId }) {
        return foregroundId ? getCoverLayerById(foregroundId) : null;
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

export const CoverLayerGraphQL = new GraphQLObjectType<
  CoverLayer,
  GraphQLContext
>({
  name: 'CoverLayer',
  description: 'Style of the background of a card cover',
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
        { width, pixelRatio }: { width: number; pixelRatio: number },
      ): string {
        return getImageURLForSize(id, width, undefined, pixelRatio);
      },
    },
    name: { type: GraphQLString },
    kind: { type: new GraphQLNonNull(CoverLayerKind) },
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

export const CoverLayerKind = new GraphQLEnumType({
  name: 'CoverLayerKind',
  values: {
    background: { value: 'background' },
    foreground: { value: 'foreground' },
  },
});

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

export const CardModuleGraphQL = new GraphQLUnionType({
  name: 'CardModule',
  description: 'User Card module',
  types: () => [SocialModuleGraphQL, MediaModuleGraphQL, TextModuleGraphQL],
  resolveType: (module: CardModule) => {
    switch (module.kind) {
      case 'media':
        return 'MediaModule';
      case 'social':
        return 'SocialModule';
      case 'text':
        return 'TextModule';
    }
  },
});

export const SocialModuleGraphQL = new GraphQLObjectType<
  CardModule,
  GraphQLContext
>({
  name: 'SocialModule',
  description: 'User Card social module',
  fields: () => ({
    data: {
      type: SocialModuleDataGraphQL,
    },
  }),
});

export const SocialModuleDataGraphQL = new GraphQLObjectType<
  CardModule['data'],
  GraphQLContext
>({
  name: 'SocialModuleData',
  description: 'User Card social module',
  fields: {
    facebook: { type: GraphQLString },
    instagram: { type: GraphQLString },
    twitter: { type: GraphQLString },
    linkdedIn: { type: GraphQLString },
    youtube: { type: GraphQLString },
    snapshat: { type: GraphQLString },
    tiktok: { type: GraphQLString },
    website: { type: GraphQLString },
    pinterest: { type: GraphQLString },
  },
});

export const MediaModuleGraphQL = new GraphQLObjectType<
  CardModule,
  GraphQLContext
>({
  name: 'MediaModule',
  description: 'User Card media module',
  fields: () => ({
    data: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(MediaGraphQL)),
      ),
    },
  }),
});

export const TextModuleGraphQL = new GraphQLObjectType<
  CardModule,
  GraphQLContext
>({
  name: 'TextModule',
  description: 'User Card text module',
  fields: () => ({
    data: {
      type: new GraphQLNonNull(GraphQLString),
    },
  }),
});
