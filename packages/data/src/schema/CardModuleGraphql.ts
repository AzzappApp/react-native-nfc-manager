import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import mapValues from 'lodash/mapValues';
import { MODULE_KINDS } from '@azzapp/shared/cardModuleHelpers';
import { TextAlignmentGraphQL } from './commonsTypes';
import { MediaImageGraphQL } from './MediaGraphQL';
import StaticMediaGraphQL from './StaticMediaGraphQL';
import type { CardModule, Media } from '#domains';
import type { GraphQLContext } from '#index';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';
import type { GraphQLFieldConfigMap } from 'graphql';

export const ModuleKindGraphQL = new GraphQLEnumType({
  name: 'CardModuleKind',
  description: 'User Card module kind',
  values: MODULE_KINDS.reduce(
    (acc, kind) => ({ ...acc, [kind]: { value: kind } }),
    {},
  ),
});

const modulesCommonFields = {
  id: {
    type: new GraphQLNonNull(GraphQLID),
    description:
      'User Card module id, unique between all modules (but not a node id)',
  },
  kind: {
    type: new GraphQLNonNull(ModuleKindGraphQL),
    description: 'User Card module kind',
  },
  visible: {
    type: new GraphQLNonNull(GraphQLBoolean),
    description: 'User Card module visibility',
  },
};

const CardModuleGraphQL = new GraphQLInterfaceType({
  name: 'CardModule',
  description: 'User Card module',
  fields: () => modulesCommonFields,
});

export default CardModuleGraphQL;

const createGrahQLCardModule = (
  moduleKind: ModuleKind,
  fields: GraphQLFieldConfigMap<CardModule, GraphQLContext>,
): GraphQLObjectType => {
  const kindName = `${moduleKind[0].toUpperCase()}${moduleKind.slice(1)}`;
  return new GraphQLObjectType({
    name: `CardModule${kindName}`,
    description: `User Card module : ${kindName}`,
    fields: () => ({
      ...mapValues(fields, (field, key) => ({
        resolve: (cardModule: CardModule) => (cardModule.data as any)?.[key],
        ...field,
      })),
      ...modulesCommonFields,
    }),
    interfaces: [CardModuleGraphQL],
    isTypeOf: (value: unknown) =>
      typeof value === 'object' &&
      value != null &&
      (value as any).kind === moduleKind,
  });
};

export const ModuleBackgroundStyleGraphQL = new GraphQLObjectType<
  any,
  GraphQLContext
>({
  name: 'ModuleBackgroundStyle',
  description: 'Style of the background of a module',
  fields: () => ({
    backgroundColor: { type: new GraphQLNonNull(GraphQLString) },
    patternColor: { type: new GraphQLNonNull(GraphQLString) },
    opacity: { type: new GraphQLNonNull(GraphQLInt) },
  }),
});

export const CardModuleBlockTextGraphQL = createGrahQLCardModule(
  'blockText',
  {},
);

export const CardModuleCarouselGraphQL = createGrahQLCardModule('carousel', {
  images: {
    type: new GraphQLNonNull(
      new GraphQLList(new GraphQLNonNull(MediaImageGraphQL)),
    ),
    resolve: (cardModule: CardModule, _, { mediaLoader }) => {
      const { data } = cardModule as any;
      return data.images ? mediaLoader.loadMany(data.images) : [];
    },
  },
  squareRatio: {
    type: new GraphQLNonNull(GraphQLBoolean),
  },
  borderSize: {
    type: new GraphQLNonNull(GraphQLInt),
  },
  borderColor: {
    type: new GraphQLNonNull(GraphQLString),
  },
  borderRadius: {
    type: new GraphQLNonNull(GraphQLInt),
  },
  marginVertical: {
    type: new GraphQLNonNull(GraphQLInt),
  },
  marginHorizontal: {
    type: new GraphQLNonNull(GraphQLInt),
  },
  imageHeight: {
    type: new GraphQLNonNull(GraphQLInt),
  },
  gap: {
    type: new GraphQLNonNull(GraphQLInt),
  },
  background: {
    type: StaticMediaGraphQL,
    resolve: (cardModule: CardModule, _, { staticMediaLoader }) => {
      const { data } = cardModule as any;
      return data.backgroundId
        ? staticMediaLoader.load(data.backgroundId)
        : null;
    },
  },
  backgroundStyle: {
    type: ModuleBackgroundStyleGraphQL,
  },
});

export const CardModuleHorizontalPhotoGraphQL = createGrahQLCardModule(
  'horizontalPhoto',
  {
    image: {
      type: new GraphQLNonNull(MediaImageGraphQL),
      description:
        'The Media image of the horizontal photo module, cannot be null',
      resolve: async (
        cardModule: CardModule,
        _,
        { mediaLoader },
      ): Promise<Media> => {
        const { data } = cardModule as any;
        return mediaLoader.load(data.image) as Promise<Media>;
      },
    },
    borderWidth: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    borderColor: {
      type: new GraphQLNonNull(GraphQLString),
    },
    borderRadius: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    marginVertical: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    marginHorizontal: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    height: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    background: {
      type: StaticMediaGraphQL,
      resolve: (cardModule: CardModule, _, { staticMediaLoader }) => {
        const { data } = cardModule as any;
        return data.backgroundId
          ? staticMediaLoader.load(data.backgroundId)
          : null;
      },
    },
    backgroundStyle: {
      type: ModuleBackgroundStyleGraphQL,
    },
  },
);

export const LineDividerOrientationGraphQL = new GraphQLEnumType({
  name: 'LineDividerOrientation',
  values: {
    topLeft: { value: 'topLeft' },
    bottomRight: { value: 'bottomRight' },
  },
});

export const CardModuleLineDividerGraphQL = createGrahQLCardModule(
  'lineDivider',
  {
    orientation: {
      type: new GraphQLNonNull(LineDividerOrientationGraphQL),
    },
    marginBottom: {
      type: GraphQLInt,
    },
    marginTop: {
      type: GraphQLInt,
    },
    height: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    colorTop: {
      type: new GraphQLNonNull(GraphQLString),
    },
    colorBottom: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
);

export const CardModuleOpeningHoursGraphQL = createGrahQLCardModule(
  'openingHours',
  {},
);

export const CardModulePhotoWithTextAndTitleGraphQL = createGrahQLCardModule(
  'photoWithTextAndTitle',
  {},
);

export const CardModuleSimpleButtonGraphQL = createGrahQLCardModule(
  'simpleButton',
  {},
);

export const CardModuleSimpleTextGraphQL = createGrahQLCardModule(
  'simpleText',
  {
    text: {
      type: new GraphQLNonNull(GraphQLString),
    },
    fontFamily: {
      type: new GraphQLNonNull(GraphQLString),
    },
    fontSize: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    color: {
      type: new GraphQLNonNull(GraphQLString),
    },
    verticalSpacing: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    textAlign: {
      type: new GraphQLNonNull(TextAlignmentGraphQL),
    },
    marginHorizontal: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    marginVertical: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    background: {
      type: StaticMediaGraphQL,
      resolve: (cardModule: CardModule, _, { staticMediaLoader }) => {
        const { data } = cardModule as any;
        return data.backgroundId
          ? staticMediaLoader.load(data.backgroundId)
          : null;
      },
    },
    backgroundStyle: {
      type: ModuleBackgroundStyleGraphQL,
    },
  },
);

export const CardModuleSimpleTitleGraphQL = createGrahQLCardModule(
  'simpleTitle',
  {
    text: {
      type: new GraphQLNonNull(GraphQLString),
    },
    fontFamily: {
      type: new GraphQLNonNull(GraphQLString),
    },
    fontSize: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    color: {
      type: new GraphQLNonNull(GraphQLString),
    },
    verticalSpacing: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    textAlign: {
      type: new GraphQLNonNull(TextAlignmentGraphQL),
    },
    marginHorizontal: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    marginVertical: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    background: {
      type: StaticMediaGraphQL,
      resolve: (cardModule: CardModule, _, { staticMediaLoader }) => {
        const { data } = cardModule as any;
        return data.backgroundId
          ? staticMediaLoader.load(data.backgroundId)
          : null;
      },
    },
    backgroundStyle: {
      type: ModuleBackgroundStyleGraphQL,
    },
  },
);

export const CardModuleSocialLinksGraphQL = createGrahQLCardModule(
  'socialLinks',
  {},
);

export const CardModulesGraphql = [
  CardModuleBlockTextGraphQL,
  CardModuleCarouselGraphQL,
  CardModuleHorizontalPhotoGraphQL,
  CardModuleLineDividerGraphQL,
  CardModuleOpeningHoursGraphQL,
  CardModulePhotoWithTextAndTitleGraphQL,
  CardModuleSimpleButtonGraphQL,
  CardModuleSimpleTextGraphQL,
  CardModuleSimpleTitleGraphQL,
  CardModuleSocialLinksGraphQL,
];
