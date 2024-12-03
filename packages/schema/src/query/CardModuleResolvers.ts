import { MODULE_KINDS } from '@azzapp/shared/cardModuleHelpers';
import { moduleBackgroundLoader } from '#loaders';
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
  CardModuleLineDividerResolvers,
  CardModuleMediaResolvers,
  CardModuleMediaTextResolvers,
} from '#/__generated__/types';
import type { CardModule as CardModuleModel } from '@azzapp/data';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';

const isKnownModule = (moduleKind: string): moduleKind is ModuleKind =>
  MODULE_KINDS.includes(moduleKind as any);

export const CardModule: CardModuleResolvers = {
  __resolveType: cardModule => {
    const { kind } = cardModule;

    if (isKnownModule(kind)) {
      const capitalized = (kind.charAt(0).toUpperCase() +
        kind.slice(1)) as Capitalize<typeof kind>;

      return `CardModule${capitalized}`;
    }

    throw new Error(`Unknown module kind: ${kind}`);
  },
};

const background = async (cardModule: CardModuleModel) => {
  const { data } = cardModule;
  return typeof data === 'object' &&
    data &&
    'backgroundId' in data &&
    typeof data.backgroundId === 'string'
    ? moduleBackgroundLoader.load(data.backgroundId)
    : null;
};

export const CardModuleCarousel: CardModuleCarouselResolvers = {
  backgroundStyle: module => module.data.backgroundStyle ?? null,
  borderColor: module => module.data.borderColor ?? null,
  gap: module => module.data.gap ?? null,
  borderRadius: module => module.data.borderRadius ?? null,
  borderWidth: module => module.data.borderWidth ?? null,
  imageHeight: module => module.data.imageHeight ?? null,
  marginHorizontal: module => module.data.marginHorizontal ?? null,
  marginVertical: module => module.data.marginVertical ?? null,
  squareRatio: module => module.data.squareRatio ?? null,
  images: async cardModule => {
    const { data } = cardModule;
    return data?.images.map(image => ({
      media: image,
      assetKind: 'module',
    }));
  },
  background,
};

export const CardModuleHorizontalPhoto: CardModuleHorizontalPhotoResolvers = {
  backgroundStyle: module => module.data.backgroundStyle ?? null,
  borderColor: module => module.data.borderColor ?? null,
  borderRadius: module => module.data.borderRadius ?? null,
  borderWidth: module => module.data.borderWidth ?? null,
  imageHeight: module => module.data.imageHeight ?? null,
  marginHorizontal: module => module.data.marginHorizontal ?? null,
  marginVertical: module => module.data.marginVertical ?? null,
  image: module => ({
    media: module.data.image,
    assetKind: 'module',
  }),
  background,
};

export const CardModuleSimpleText: CardModuleSimpleTextResolvers = {
  backgroundStyle: module => module.data.backgroundStyle ?? null,
  fontColor: module => module.data.fontColor ?? null,
  fontFamily: module => module.data.fontFamily ?? null,
  marginHorizontal: module => module.data.marginHorizontal ?? null,
  marginVertical: module => module.data.marginVertical ?? null,
  fontSize: module => module.data.fontSize ?? null,
  textAlign: module => module.data.textAlign ?? null,
  verticalSpacing: module => module.data.verticalSpacing ?? null,
  text: module => module.data.text ?? null,
  background,
};

export const CardModuleSimpleTitle: CardModuleSimpleTitleResolvers = {
  backgroundStyle: module => module.data.backgroundStyle ?? null,
  fontColor: module => module.data.fontColor ?? null,
  fontFamily: module => module.data.fontFamily ?? null,
  marginHorizontal: module => module.data.marginHorizontal ?? null,
  fontSize: module => module.data.fontSize ?? null,
  textAlign: module => module.data.textAlign ?? null,
  marginVertical: module => module.data.marginVertical ?? null,
  text: module => module.data.text,
  verticalSpacing: module => module.data.verticalSpacing ?? null,
  background,
};

export const CardModuleSimpleButton: CardModuleSimpleButtonResolvers = {
  actionLink: module => module.data.actionLink,
  backgroundStyle: module => module.data.backgroundStyle ?? null,
  actionType: module => module.data.actionType,
  borderColor: module => module.data.borderColor ?? null,
  borderRadius: module => module.data.borderRadius ?? null,
  borderWidth: module => module.data.borderWidth ?? null,
  buttonColor: module => module.data.buttonColor ?? null,
  buttonLabel: module => module.data.buttonLabel,
  fontColor: module => module.data.fontColor ?? null,
  fontSize: module => module.data.fontSize ?? null,
  fontFamily: module => module.data.fontFamily ?? null,
  height: module => module.data.height ?? null,
  marginBottom: module => module.data.marginBottom ?? null,
  marginTop: module => module.data.marginTop ?? null,
  width: module => module.data.width ?? null,
  background,
};
export const CardModuleLineDivider: CardModuleLineDividerResolvers = {
  colorBottom: module => module.data.colorBottom ?? null,
  colorTop: module => module.data.colorTop ?? null,
  marginBottom: module => module.data.marginBottom ?? null,
  height: module => module.data.height ?? null,
  marginTop: module => module.data.marginTop ?? null,
  orientation: module => module.data.orientation ?? null,
};

export const CardModulePhotoWithTextAndTitle: CardModulePhotoWithTextAndTitleResolvers =
  {
    image: module => module.data.image,
    backgroundStyle: module => module.data.backgroundStyle ?? null,
    contentFontFamily: module => module.data.contentFontFamily ?? null,
    contentFontColor: module => module.data.contentFontColor ?? null,
    contentTextAlign: module => module.data.contentTextAlign ?? null,
    contentFontSize: module => module.data.contentFontSize ?? null,
    contentVerticalSpacing: module =>
      module.data.contentVerticalSpacing ?? null,
    content: module => module.data.content ?? null,
    titleFontFamily: module => module.data.titleFontFamily ?? null,
    titleFontColor: module => module.data.titleFontColor ?? null,
    titleTextAlign: module => module.data.titleTextAlign ?? null,
    titleFontSize: module => module.data.titleFontSize ?? null,
    titleVerticalSpacing: module => module.data.titleVerticalSpacing ?? null,
    title: module => module.data.title ?? null,
    marginHorizontal: module => module.data.marginHorizontal ?? null,
    marginVertical: module => module.data.marginVertical ?? null,
    background,
    aspectRatio: module => module.data.aspectRatio ?? null,
    borderRadius: module => module.data.borderRadius ?? null,
    gap: module => module.data.gap ?? null,
    horizontalArrangement: module => module.data.horizontalArrangement ?? null,
    imageMargin: module => module.data.imageMargin ?? null,
    verticalArrangement: module => module.data.verticalArrangement ?? null,
  };

export const CardModuleSocialLinks: CardModuleSocialLinksResolvers = {
  links: module => module.data.links,
  iconColor: module => module.data.iconColor ?? null,
  arrangement: module => module.data.arrangement ?? null,
  iconSize: module => module.data.iconSize ?? null,
  borderWidth: module => module.data.borderWidth ?? null,
  columnGap: module => module.data.columnGap ?? null,
  marginTop: module => module.data.marginTop ?? null,
  marginBottom: module => module.data.marginBottom ?? null,
  marginHorizontal: module => module.data.marginHorizontal ?? null,
  backgroundStyle: module => module.data.backgroundStyle ?? null,
  background,
};

export const CardModuleBlockText: CardModuleBlockTextResolvers = {
  text: module => module.data.text,
  fontFamily: module => module.data.fontFamily ?? null,
  fontColor: module => module.data.fontColor ?? null,
  textAlign: module => module.data.textAlign ?? null,
  fontSize: module => module.data.fontSize ?? null,
  verticalSpacing: module => module.data.verticalSpacing ?? null,
  textMarginVertical: module => module.data.textMarginVertical ?? null,
  textMarginHorizontal: module => module.data.textMarginHorizontal ?? null,
  marginHorizontal: module => module.data.marginHorizontal ?? null,
  marginVertical: module => module.data.marginVertical ?? null,
  backgroundStyle: module => module.data.backgroundStyle ?? null,
  textBackgroundStyle: module => module.data.textBackgroundStyle ?? null,
  background,
  textBackground: module =>
    module.data.textBackgroundId
      ? moduleBackgroundLoader.load(module.data.textBackgroundId)
      : null,
};

export const CardModuleMedia: CardModuleMediaResolvers = {
  cardModuleColor: module => module.data.cardModuleColor ?? {},
  cardModuleMedias: async ({ data }) => {
    return data.cardModuleMedias?.map(({ media, text, title }) => ({
      media: { media: media.id, assetKind: 'module' },
      text,
      title,
    }));
  },
};

export const CardModuleMediaText: CardModuleMediaTextResolvers = {
  cardModuleColor: module => module.data.cardModuleColor ?? {},
  cardModuleMedias: async ({ data }) => {
    return data.cardModuleMedias?.map(({ media, text, title }) => ({
      media: { media: media.id, assetKind: 'module' },
      text,
      title,
    }));
  },
};
