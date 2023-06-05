import { fromGlobalId } from 'graphql-relay';
import { getCompanyActivityById, getProfileCategoryById } from '#domains';
import type { NodeResolvers } from './__generated__/types';
import type { GraphQLContext } from './GraphQLContext';

const profileSymbol = Symbol('Profile');
const profileCategorySymbol = Symbol('ProfileCategory');
const companyActivitySymbol = Symbol('CompanyActivity');
const cardSymbol = Symbol('Card');
const postSymbol = Symbol('Post');
const postCommentSymbol = Symbol('PostComment');
const coverTemplate = Symbol('CoverTemplate');

export const fetchNode = async (
  gqlId: string,
  {
    profileLoader,
    cardLoader,
    postLoader,
    postCommentLoader,
    coverTemplateLoader,
  }: GraphQLContext,
) => {
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
    case 'PostComment':
      return withTypeSymbol(
        await postCommentLoader.load(id),
        postCommentSymbol,
      );
    case 'CoverTemplate':
      return withTypeSymbol(await coverTemplateLoader.load(id), coverTemplate);
  }
  return null;
};

const withTypeSymbol = <T extends object | null>(value: T, symbol: symbol): T =>
  (value ? { ...value, [symbol]: true } : null) as T;

const resolveNode = (value: any) => {
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
  if (value[postCommentSymbol]) {
    return 'PostComment';
  }
  if (value[coverTemplate]) {
    return 'CoverTemplate';
  }
  return null;
};

export const Node: NodeResolvers = {
  __resolveType: resolveNode,
};
