import { MODULE_KINDS } from '@azzapp/shared/cardModuleHelpers';
import ERRORS from '@azzapp/shared/errors';
import type { CardModule as CardModuleModel, Media } from '#domains';
import type {
  CardModuleCarouselResolvers,
  CardModuleHorizontalPhotoResolvers,
  CardModuleResolvers,
  CardModuleSimpleButtonResolvers,
  CardModuleSimpleTextResolvers,
  CardModuleSimpleTitleResolvers,
  CardModulePhotoWithTextAndTitleResolvers,
  CardModuleSocialLinksResolvers,
  CardModuleBlockTextResolvers,
} from './__generated__/types';
import type { GraphQLContext } from './GraphQLContext';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';

const isKnownModule = (moduleKind: string): moduleKind is ModuleKind =>
  (MODULE_KINDS as string[]).includes(moduleKind);

export const CardModule: CardModuleResolvers = {
  __resolveType: cardModule => {
    const { kind } = cardModule;

    if (isKnownModule(kind) && kind !== 'webCardsCarousel') {
      const capitalized = (kind.charAt(0).toUpperCase() +
        kind.slice(1)) as Capitalize<typeof kind>;

      return `CardModule${capitalized}`;
    }

    throw new Error(`Unknown module kind: ${kind}`);
  },
};

const background = (
  cardModule: CardModuleModel,
  _: unknown,
  { staticMediaLoader }: GraphQLContext,
) => {
  const { data } = cardModule;
  return typeof data === 'object' &&
    data &&
    'backgroundId' in data &&
    typeof data.backgroundId === 'string'
    ? staticMediaLoader.load(data.backgroundId)
    : null;
};

function getData<TResult, B>(
  key: keyof CardModuleModel['data'],
  optional?: B,
): (cardModule: CardModuleModel) => B extends true ? TResult | null : TResult;
function getData<TResult>(key: keyof CardModuleModel['data'], optional: true) {
  return (cardModule: CardModuleModel): TResult | null => {
    const { data } = cardModule;
    if (data && key in data) {
      return data[key] as TResult;
    }
    if (optional) {
      return null;
    } else {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
  };
}

export const CardModuleCarousel: CardModuleCarouselResolvers = {
  backgroundStyle: getData('backgroundStyle', true),
  borderColor: getData('borderColor'),
  gap: getData('gap'),
  borderRadius: getData('borderRadius'),
  borderSize: getData('borderSize'),
  imageHeight: getData('imageHeight'),
  marginHorizontal: getData('marginHorizontal'),
  marginVertical: getData('marginVertical'),
  squareRatio: getData('squareRatio'),
  images: async (cardModule, _, { mediaLoader }) => {
    const { data } = cardModule;
    return data?.images
      ? ((await mediaLoader.loadMany(data.images)).filter(
          m => m && !(m instanceof Error),
        ) as Media[])
      : [];
  },
  background,
};

export const CardModuleHorizontalPhoto: CardModuleHorizontalPhotoResolvers = {
  backgroundStyle: getData('backgroundStyle', true),
  borderColor: getData('borderColor'),
  borderRadius: getData('borderRadius'),
  borderWidth: getData('borderWidth'),
  height: getData('height'),
  marginHorizontal: getData('marginHorizontal'),
  marginVertical: getData('marginVertical'),
  image: async (cardModule, _, { mediaLoader }) => {
    const { data } = cardModule;
    if (data && typeof data === 'object' && 'image' in data) {
      const image = await mediaLoader.load(data.image as string);
      if (image) {
        return image;
      }
    }

    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  },
  background,
};

export const CardModuleSimpleText: CardModuleSimpleTextResolvers = {
  backgroundStyle: getData('backgroundStyle', true),
  color: getData('color'),
  fontFamily: getData('fontFamily'),
  marginHorizontal: getData('marginHorizontal'),
  marginVertical: getData('marginVertical'),
  fontSize: getData('fontSize'),
  textAlign: getData('textAlign'),
  verticalSpacing: getData('verticalSpacing'),
  text: getData('text'),
  background,
};

export const CardModuleSimpleTitle: CardModuleSimpleTitleResolvers = {
  backgroundStyle: getData('backgroundStyle', true),
  color: getData('color'),
  fontFamily: getData('fontFamily'),
  marginHorizontal: getData('marginHorizontal'),
  fontSize: getData('fontSize'),
  textAlign: getData('textAlign'),
  marginVertical: getData('marginVertical'),
  text: getData('text'),
  verticalSpacing: getData('verticalSpacing'),
  background,
};

export const CardModuleSimpleButton: CardModuleSimpleButtonResolvers = {
  actionLink: getData('actionLink'),
  backgroundStyle: getData('backgroundStyle', true),
  actionType: getData('actionType'),
  borderColor: getData('borderColor'),
  borderRadius: getData('borderRadius'),
  borderWidth: getData('borderWidth'),
  buttonColor: getData('buttonColor'),
  buttonLabel: getData('buttonLabel'),
  fontColor: getData('fontColor'),
  fontSize: getData('fontSize'),
  fontFamily: getData('fontFamily'),
  height: getData('height'),
  marginBottom: getData('marginBottom'),
  marginTop: getData('marginTop'),
  width: getData('width'),
  background,
};

export const CardModulePhotoWithTextAndTitle: CardModulePhotoWithTextAndTitleResolvers =
  {
    image: async (cardModule, _, { mediaLoader }) => {
      const { data } = cardModule;
      if (data && typeof data === 'object' && 'image' in data) {
        const image = await mediaLoader.load(data.image as string);
        if (image) {
          return image;
        }
      }

      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    },
    title: getData('title'),
    text: getData('text'),
    backgroundStyle: getData('backgroundStyle', true),
    fontFamily: getData('fontFamily'),
    marginHorizontal: getData('marginHorizontal'),
    fontSize: getData('fontSize'),
    textAlign: getData('textAlign'),
    marginVertical: getData('marginVertical'),
    verticalSpacing: getData('verticalSpacing'),
    background,
    aspectRatio: getData('aspectRatio'),
    borderRadius: getData('borderRadius'),
    fontColor: getData('fontColor'),
    gap: getData('gap'),
    horizontalArrangement: getData('horizontalArrangement'),
    imageMargin: getData('imageMargin'),
    textSize: getData('textSize'),
    verticalArrangement: getData('verticalArrangement'),
  };

export const CardModuleSocialLinks: CardModuleSocialLinksResolvers = {
  links: getData('links'),
  iconColor: getData('iconColor'),
  arrangement: getData('arrangement'),
  iconSize: getData('iconSize'),
  borderWidth: getData('borderWidth'),
  columnGap: getData('columnGap'),
  marginTop: getData('marginTop'),
  marginBottom: getData('marginBottom'),
  marginHorizontal: getData('marginHorizontal'),
  backgroundStyle: getData('backgroundStyle', true),
  background,
};

const textBackground = (
  cardModule: CardModuleModel,
  _: unknown,
  { staticMediaLoader }: GraphQLContext,
) => {
  const { data } = cardModule;
  return data.textBackgroundId
    ? staticMediaLoader.load(data.textBackgroundId)
    : null;
};

export const CardModuleBlockText: CardModuleBlockTextResolvers = {
  fontFamily: getData('fontFamily'),
  fontColor: getData('fontColor'),
  textAlign: getData('textAlign'),
  fontSize: getData('fontSize'),
  verticalSpacing: getData('verticalSpacing'),
  textMarginVertical: getData('textMarginVertical'),
  textMarginHorizontal: getData('textMarginHorizontal'),
  marginHorizontal: getData('marginHorizontal'),
  marginVertical: getData('marginVertical'),
  backgroundStyle: getData('backgroundStyle', true),
  textBackgroundStyle: getData('textBackgroundStyle', true),
  background,
  textBackground,
};
