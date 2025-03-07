import { fromGlobalId } from 'graphql-relay';
import {
  cardStyleLoader,
  cardTemplateLoader,
  cardTemplateTypeLoader,
  colorPaletteLoader,
  companyActivityLoader,
  coverTemplateLoader,
  postCommentLoader,
  postLoader,
  profileLoader,
  webCardCategoryLoader,
  webCardLoader,
} from '#loaders';
import type { NodeResolvers } from '#/__generated__/types';

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

// TODO - Add more security checks here
export const fetchNode = async (gqlId: string): Promise<any> => {
  if (!gqlId) {
    return null;
  }
  const { id, type } = fromGlobalId(gqlId);

  switch (type) {
    case 'CardStyle':
      return withTypeSymbol(await cardStyleLoader.load(id), cardStyleSymbol);
    case 'ColorPalette':
      return withTypeSymbol(
        await colorPaletteLoader.load(id),
        colorPaletteSymbol,
      );
    case 'CardTemplate':
      return withTypeSymbol(
        await cardTemplateLoader.load(id),
        cardTemplateSymbol,
      );
    case 'CardTemplateType':
      return withTypeSymbol(
        await cardTemplateTypeLoader.load(id),
        cardTemplateTypeSymbol,
      );
    case 'CoverTemplate':
      return withTypeSymbol(
        await coverTemplateLoader.load(id),
        coverTemplateSymbol,
      );
    case 'Post':
      return withTypeSymbol(await postLoader.load(id), postSymbol);
    case 'PostComment':
      return withTypeSymbol(
        await postCommentLoader.load(id),
        postCommentSymbol,
      );
    case 'Profile':
      return withTypeSymbol(await profileLoader.load(id), profileSymbol);
    case 'WebCard': {
      const webCard = await webCardLoader.load(id);
      return withTypeSymbol(webCard?.deleted ? null : webCard, webCardSymbol);
    }
    case 'WebCardCategory':
      return withTypeSymbol(
        await webCardCategoryLoader.load(id),
        webCardCategorySymbol,
      );
    case 'CompanyActivity':
      return withTypeSymbol(
        await companyActivityLoader.load(id),
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
