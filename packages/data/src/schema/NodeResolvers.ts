import { fromGlobalId } from 'graphql-relay';
import type { NodeResolvers } from './__generated__/types';
import type { GraphQLContext } from './GraphQLContext';

const cardStyleSymbol = Symbol('CardStyle');
const colorPaletteSymbol = Symbol('ColorPalette');
const cardTemplateSymbol = Symbol('CardTemplate');
const cardTemplateTypeSymbol = Symbol('CardTemplateType');
const coverTemplateSymbol = Symbol('CoverTemplate');
const postSymbol = Symbol('Post');
const postCommentSymbol = Symbol('PostComment');
const profileSymbol = Symbol('Profile');
const webCardSymbol = Symbol('WebCard');
const webCardCategorySymbol = Symbol('WebCardCategory');
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
    case 'CardTemplateType':
      return withTypeSymbol(
        await loaders.CardTemplateType.load(id),
        cardTemplateTypeSymbol,
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
    case 'WebCard':
      return withTypeSymbol(await loaders.WebCard.load(id), webCardSymbol);
    case 'WebCardCategory':
      return withTypeSymbol(
        await loaders.WebCardCategory.load(id),
        webCardCategorySymbol,
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
  if (value[cardTemplateTypeSymbol]) {
    return 'CardTemplateType';
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
  if (value[webCardSymbol]) {
    return 'WebCard';
  }
  if (value[webCardCategorySymbol]) {
    return 'WebCardCategory';
  }
  if (value[companyActivitySymbol]) {
    return 'CompanyActivity';
  }
  return null;
};

export const Node: NodeResolvers = {
  __resolveType: resolveNode,
};
