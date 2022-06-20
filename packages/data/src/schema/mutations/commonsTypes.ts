import { GraphQLInputObjectType, GraphQLNonNull, GraphQLString } from 'graphql';
import { MediaKindGraphQL } from '../commonsTypes';

export const MediaInputGraphQL = new GraphQLInputObjectType({
  name: 'MediaInput',
  description: 'User Card media module media',
  fields: () => ({
    kind: {
      type: new GraphQLNonNull(MediaKindGraphQL),
    },
    source: {
      type: new GraphQLNonNull(GraphQLString),
    },
  }),
});
