import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
  GraphQLInt,
  GraphQLFloat,
} from 'graphql';
import { globalIdField } from 'graphql-relay';
import { getUserById } from '../domains/User';
import MediaGraphQL from './MediaGraphQL';
import NodeGraphQL from './NodeGraphQL';
import UserGraphQL from './UserGraphQL';
import type { Media } from '../domains/commons';
import type {
  MediaModule,
  SocialModule,
  TextModule,
  UserCard,
  UserCardCover,
  UserCardModule,
} from '../domains/UserCard';
import type { GraphQLContext } from './GraphQLContext';

const UserCardGraphQL = new GraphQLObjectType<UserCard, GraphQLContext>({
  name: 'UserCard',
  description: 'An azzapp User card',
  interfaces: [NodeGraphQL],
  fields: () => ({
    id: globalIdField('UserCard', (card: UserCard) =>
      JSON.stringify([card.userId, card.cardId]),
    ),
    user: {
      type: new GraphQLNonNull(UserGraphQL),
      resolve: card => getUserById(card.userId),
    },
    cover: {
      type: new GraphQLNonNull(UserCardCoverGraphQL),
      description: 'Card cover display informations',
    },
    modules: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(UserCardModuleGraphQL)),
      ),
      description: 'Definitions of the cards modules',
    },
  }),
});

export default UserCardGraphQL;

export const MediaGraphql = new GraphQLObjectType<Media, GraphQLContext>({
  name: 'UserCardCover',
  description: 'UserCard cover display informations',
  fields: () => ({
    kind: {
      type: new GraphQLNonNull(MediaGraphQL),
      description: 'the background color of the card',
    },
    pictures: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString)),
      ),
      description: 'the pictures of the card cover',
    },
  }),
});

export const UserCardCoverGraphQL = new GraphQLObjectType<
  UserCardCover,
  GraphQLContext
>({
  name: 'UserCardCover',
  description: 'UserCard cover display informations',
  fields: () => ({
    backgroundColor: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'the background color of the card',
    },
    pictures: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(MediaGraphQL)),
      ),
      description: 'the pictures of the card cover',
    },
    pictureTransitionTimer: {
      type: new GraphQLNonNull(GraphQLFloat),
      description:
        'the time, in seconds, a picture stay displayed before transition in case of multiple pictures',
    },
    overlayEffect: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'the overlay effect applied to the card cover',
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'the title of the card cover',
    },
    titlePosition: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'the title position in the card cover',
    },
    titleFont: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'the font family used to display the title',
    },
    titleFontSize: {
      type: new GraphQLNonNull(GraphQLInt),
      description: 'the font size of used to display the title',
    },
    titleColor: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'the color used to display the title',
    },
    titleRotation: {
      type: new GraphQLNonNull(GraphQLInt),
      description: 'the rotation of the title',
    },
    qrCodePosition: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'the position of the qr code in the card',
    },
    desktopLayout: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'the layout used to display the cover on desktop',
    },
    dektopImagePosition: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'the position of the backround image on desktop',
    },
  }),
});

export const UserCardModuleGraphQL = new GraphQLUnionType({
  name: 'UserCardModule',
  description: 'User Card module',
  types: () => [SocialModuleGraphQL, MediaModuleGraphQL, TextModuleGraphQL],
  resolveType: (module: UserCardModule) => {
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
  SocialModule,
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
  SocialModule,
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
  MediaModule,
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
  TextModule,
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
