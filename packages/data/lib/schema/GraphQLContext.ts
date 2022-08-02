export type GraphQLContextData = {
  userId: string | null;
  isAnonymous: boolean;
  locale?: string | null;
  location?: { lat: number; lng: number };
};

// TODO add loader to avoid multiple database roundtrip
export type GraphQLContext = GraphQLContextData;

export const createGraphQLContext = (contextData?: GraphQLContextData) =>
  contextData ?? { userId: null, isAnonymous: true };
