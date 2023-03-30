import { fromGlobalId, nodeDefinitions } from 'graphql-relay';
import { getCompanyActivityById, getProfileCategoryById } from '#domains';
import type {
  Card,
  CardCover,
  CoverTemplate,
  Post,
  Profile,
  ProfileCategory,
  CompanyActivity,
} from '#domains';
import type { GraphQLContext } from './GraphQLContext';

const profileSymbol = Symbol('Profile');
const profileCategorySymbol = Symbol('ProfileCategory');
const companyActivitySymbol = Symbol('CompanyActivity');
const cardSymbol = Symbol('Card');
const postSymbol = Symbol('Post');
const coverTemplate = Symbol('CoverTemplate');

const fetchNode = async (
  gqlId: string,
  {
    profileLoader,
    cardLoader,
    postLoader,
    coverTemplateLoader,
  }: GraphQLContext,
): Promise<
  | Card
  | CardCover
  | CompanyActivity
  | CoverTemplate
  | Post
  | Profile
  | ProfileCategory
  | null
> => {
  const { id, type } = fromGlobalId(gqlId);
  switch (type) {
    case 'Profile':
      return withTypeSymbol(await profileLoader.load(id), profileSymbol);
    case 'ProfileCategory':
      return withTypeSymbol(
        await getProfileCategoryById(id),
        profileCategorySymbol,
      );
    case 'Card':
      return withTypeSymbol(await cardLoader.load(id), cardSymbol);
    case 'CompanyActivity':
      return withTypeSymbol(
        await getCompanyActivityById(id),
        companyActivitySymbol,
      );
    case 'Post':
      return withTypeSymbol(await postLoader.load(id), postSymbol);
    case 'CoverTemplate':
      return withTypeSymbol(await coverTemplateLoader.load(id), coverTemplate);
  }
  return null;
};

const withTypeSymbol = <T extends object | null>(value: T, symbol: symbol): T =>
  (value ? { ...value, [symbol]: true } : null) as T;

const resolveNode = (value: any): string | undefined => {
  if (value[profileSymbol]) {
    return 'Profile';
  }
  if (value[profileCategorySymbol]) {
    return 'ProfileCategory';
  }
  if (value[cardSymbol]) {
    return 'Card';
  }
  if (value[companyActivitySymbol]) {
    return 'CompanyActivity';
  }
  if (value[postSymbol]) {
    return 'Post';
  }
  if (value[coverTemplate]) {
    return 'CoverTemplate';
  }
  return undefined;
};

const {
  nodeField,
  nodesField,
  nodeInterface: NodeGraphQL,
} = nodeDefinitions(fetchNode, resolveNode);

export { nodeField, nodesField };

export default NodeGraphQL;
