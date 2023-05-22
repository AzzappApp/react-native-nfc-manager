import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLList,
  GraphQLBoolean,
} from 'graphql';
import { globalIdField } from 'graphql-relay';
import { GraphQLJSON } from 'graphql-scalars';
import {
  CardCoverTextStyleGraphQL,
  CoverBackgroundStyleGraphQL,
  CoverContentStyleGraphQL,
  CoverForegroundStyleGraphQL,
} from './CardCoverGraphQL';
import { ProfileKindGraphQL } from './commonsTypes';
import { MediaImageGraphQL } from './MediaGraphQL';
import NodeGraphQL from './NodeGraphQL';
import StaticMediaGraphQL from './StaticMediaGraphQL';
import type { GraphQLContext } from './GraphQLContext';
import type { CoverTemplate, Media } from '@prisma/client';

const CoverTemplateGraphQL = new GraphQLObjectType<
  CoverTemplate,
  GraphQLContext
>({
  name: 'CoverTemplate',
  interfaces: [NodeGraphQL],
  description: 'Template for a cover',
  fields: () => ({
    id: globalIdField('CoverTemplate'),
    name: { type: GraphQLString },
    kind: { type: ProfileKindGraphQL },
    data: { type: new GraphQLNonNull(CardCoverTemplateGraphQL) },
    enabled: { type: new GraphQLNonNull(GraphQLBoolean) },
    category: { type: new GraphQLList(CoverTemplateCategorGraphQL) },
    suggested: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    previewMedia: {
      type: MediaImageGraphQL,
      resolve: (
        { previewMediaId },
        _,
        { mediaLoader },
      ): Promise<Media> | null => {
        if (previewMediaId) {
          return mediaLoader.load(previewMediaId) as Promise<Media>;
        }
        return null;
      },
    },
    colorPalette: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      resolve({ colorPalette }) {
        return colorPalette ? colorPalette.split(',') : null;
      },
    },
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

export default CoverTemplateGraphQL;

export const CoverTemplateCategorGraphQL = new GraphQLObjectType<
  any,
  GraphQLContext
>({
  name: 'CoverTemplateCategorGraphQL',
  description: 'Category of a cover template',
  fields: () => ({
    id: { type: GraphQLString, description: 'Should be a country code' },
    cateogry: { type: GraphQLString },
  }),
});

const CardCoverTemplateGraphQL = new GraphQLObjectType<
  Record<string, any>, //TODO: should do better than any
  GraphQLContext
>({
  name: 'CardCoverTemplate',
  description: 'Card cover display informations',
  fields: () => ({
    mediaStyle: {
      type: GraphQLJSON,
    },
    sourceMedia: {
      type: MediaImageGraphQL,
      description:
        'The source of the media used by the cover for a suggested template',
      resolve: (
        { sourceMediaId },
        _,
        { mediaLoader },
      ): Promise<Media> | null => {
        if (sourceMediaId) {
          return mediaLoader.load(sourceMediaId) as Promise<Media>;
        }
        return null;
      },
    },
    background: {
      type: StaticMediaGraphQL,
      description: 'The background of the cover',
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
      type: GraphQLString,
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
