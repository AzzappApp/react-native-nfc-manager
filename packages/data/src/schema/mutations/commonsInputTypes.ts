import {
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';

export const MediaInputGraphQL = new GraphQLInputObjectType({
  name: 'MediaInput',
  description: 'User Card media module media',
  fields: () => ({
    kind: {
      type: new GraphQLNonNull(MediaKindGraphQL),
    },
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    width: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
    height: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
  }),
});

export const MediaKindGraphQL = new GraphQLEnumType({
  name: 'MediaKind',
  values: {
    video: { value: 'video' },
    image: { value: 'image' },
  },
});

export const ModuleBackgroundStyleInputGraphQL = new GraphQLInputObjectType({
  name: 'ModuleBackgroundInputStyle',
  description: 'Style of the background of a module',
  fields: () => ({
    backgroundColor: { type: new GraphQLNonNull(GraphQLString) },
    patternColor: { type: new GraphQLNonNull(GraphQLString) },
    opacity: { type: new GraphQLNonNull(GraphQLInt) },
  }),
});
