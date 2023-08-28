import { fromGlobalId } from 'graphql-relay';
import type { NodeResolvers } from './__generated__/types';
import type { GraphQLContext } from './GraphQLContext';

const cardStyleSymbol = Symbol('CardStyle');
const colorPaletteSymbol = Symbol('ColorPalette');
const cardTemplateSymbol = Symbol('CardTemplate');
const coverTemplateSymbol = Symbol('CoverTemplate');
const postSymbol = Symbol('Post');
const postCommentSymbol = Symbol('PostComment');
const profileSymbol = Symbol('Profile');
const profileCategorySymbol = Symbol('ProfileCategory');
const companyActivitySymbol = Symbol('CompanyActivity');

export const fetchNode = async (
  gqlId: string,
  { loaders }: GraphQLContext,
): Promise<any> => {
  const { id, type } = fromGlobalId(gqlId);

  switch (type) {
    case 'CardStyle':
      return withTypeSymbol(await loaders.CardStyle.load(id), cardStyleSymbol);
    case 'ColorPalette':
      return withTypeSymbol(
        await loaders.ColorPalette.load(id),
        colorPaletteSymbol,
      );
    case 'CardTemplate':
      return withTypeSymbol(
        await loaders.CardTemplate.load(id),
        cardTemplateSymbol,
      );
    case 'CoverTemplate':
      return withTypeSymbol(
        await loaders.CoverTemplate.load(id),
        coverTemplateSymbol,
      );
    case 'Post':
      return withTypeSymbol(await loaders.Post.load(id), postSymbol);
    case 'PostComment':
      return withTypeSymbol(
        await loaders.PostComment.load(id),
        postCommentSymbol,
      );
    case 'Profile':
      return withTypeSymbol(await loaders.Profile.load(id), profileSymbol);
    case 'ProfileCategory':
      return withTypeSymbol(
        await loaders.ProfileCategory.load(id),
        profileCategorySymbol,
      );
    case 'CompanyActivity':
      return withTypeSymbol(
        await loaders.CompanyActivity.load(id),
        companyActivitySymbol,
      );
  }
  return null;
};

const withTypeSymbol = <T extends object | null>(value: T, symbol: symbol): T =>
  (value ? { ...value, [symbol]: true } : null) as T;

const resolveNode = (value: any) => {
  if (value[cardStyleSymbol]) {
    return 'CardStyle';
  }
  if (value[colorPaletteSymbol]) {
    return 'ColorPalette';
  }
  if (value[cardTemplateSymbol]) {
    return 'CardTemplate';
  }
  if (value[coverTemplateSymbol]) {
    return 'CoverTemplate';
  }
  if (value[postSymbol]) {
    return 'Post';
  }
  if (value[postCommentSymbol]) {
    return 'PostComment';
  }
  if (value[profileSymbol]) {
    return 'Profile';
  }
  if (value[profileCategorySymbol]) {
    return 'ProfileCategory';
  }
  if (value[companyActivitySymbol]) {
    return 'CompanyActivity';
  }
  return null;
};

export const Node: NodeResolvers = {
  __resolveType: resolveNode,
};
