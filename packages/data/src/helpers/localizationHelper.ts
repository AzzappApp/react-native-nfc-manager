import type { GraphQLContext } from '../schema/GraphQLContext';
import type { GraphQLFieldResolver } from 'graphql';

const localizedLabelResolver =
  <TSource, TLabelProperty extends keyof TSource>(
    property: TLabelProperty,
  ): GraphQLFieldResolver<TSource, GraphQLContext> =>
  (source, args, { locale }) => {
    const labels = source[property] as any;
    return labels[locale];
  };

export default localizedLabelResolver;
