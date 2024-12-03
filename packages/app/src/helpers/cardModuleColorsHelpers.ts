import type { ModuleKindAndVariant } from './webcardModuleHelpers';
import type { CardModuleColor } from '@azzapp/shared/cardModuleHelpers';

export const dyptichByModuleVariant = (
  module: ModuleKindAndVariant,
): CardModuleColor[] | null => {
  switch (module.moduleKind) {
    case 'media':
      switch (module.variant) {
        case 'slideshow':
          return [
            {
              background: 'dark',
              content: 'transparent',
              title: 'transparent',
              text: 'transparent',
              graphic: 'transparent',
            },
            {
              background: 'light',
              content: 'transparent',
              title: 'transparent',
              text: 'transparent',
              graphic: 'transparent',
            },
            {
              background: 'primary',
              content: 'transparent',
              title: 'transparent',
              text: 'transparent',
              graphic: 'transparent',
            },
          ];
        case 'parallax':
          return null;
      }
      break;
    case 'mediaText':
      switch (module.variant) {
        case 'alternation':
          return [
            {
              background: 'light',
              content: 'transparent',
              title: 'dark',
              text: 'dark',
              graphic: 'transparent',
            },
            {
              background: 'light',
              content: 'transparent',
              title: 'primary',
              text: 'dark',
              graphic: 'transparent',
            },
            {
              background: 'dark',
              content: 'transparent',
              title: 'light',
              text: 'light',
              graphic: 'transparent',
            },
            {
              background: 'dark',
              content: 'transparent',
              title: 'primary',
              text: 'light',
              graphic: 'transparent',
            },
            {
              background: 'primary',
              content: 'transparent',
              title: 'dark',
              text: 'dark',
              graphic: 'transparent',
            },
            {
              background: 'primary',
              content: 'transparent',
              title: 'light',
              text: 'light',
              graphic: 'transparent',
            },
            {
              background: 'primary',
              content: 'transparent',
              title: 'dark',
              text: 'light',
              graphic: 'transparent',
            },
            {
              background: 'primary',
              content: 'transparent',
              title: 'light',
              text: 'dark',
              graphic: 'transparent',
            },
          ];
        case 'parallax':
          return [
            {
              background: 'dark',
              content: 'transparent',
              title: 'light',
              text: 'light',
              graphic: 'transparent',
            },
            {
              background: 'light',
              content: 'transparent',
              title: 'dark',
              text: 'dark',
              graphic: 'transparent',
            },
            {
              background: 'primary',
              content: 'transparent',
              title: 'light',
              text: 'light',
              graphic: 'transparent',
            },
            {
              background: 'primary',
              content: 'transparent',
              title: 'dark',
              text: 'dark',
              graphic: 'transparent',
            },
          ];
      }
      break;
    default:
      break;
  }
  return [
    {
      background: 'light',
      content: 'dark',
      title: 'dark',
      text: 'dark',
      graphic: 'light',
    },
  ]; //returning a default value is easier
};

export const getInitalDyptichColor = (
  module: ModuleKindAndVariant,
  coverBackgroundColor: string | null = 'light',
): CardModuleColor => {
  const key = [module.moduleKind, module.variant, coverBackgroundColor].join(
    ',',
  );
  switch (key) {
    case 'media,slideshow,dark':
      return {
        background: 'dark',
        content: 'transparent',
        title: 'transparent',
        text: 'transparent',
        graphic: 'transparent',
      };
    case 'media,slideshow,light':
      return {
        background: 'light',
        content: 'transparent',
        title: 'transparent',
        text: 'transparent',
        graphic: 'transparent',
      };
    case 'media,slideshow,primary':
      return {
        background: 'primary',
        content: 'transparent',
        title: 'transparent',
        text: 'transparent',
        graphic: 'transparent',
      };
    case 'media,parallax,light':
    case 'media,parallax,dark':
    case 'media,parallax,primary':
      return EMPTY_CARD_MODULE_COLOR;
    case 'mediaText,alternation,light':
      return {
        background: 'light',
        content: 'transparent',
        title: 'dark',
        text: 'dark',
        graphic: 'transparent',
      };
    case 'mediaText,alternation,dark':
      return {
        background: 'dark',
        content: 'transparent',
        title: 'light',
        text: 'light',
        graphic: 'transparent',
      };
    case 'mediaText,alternation,primary':
      return {
        background: 'primary',
        content: 'transparent',
        title: 'dark',
        text: 'dark',
        graphic: 'transparent',
      };
    case 'mediaText,parallax,light':
      return {
        background: 'light',
        content: 'transparent',
        title: 'dark',
        text: 'dark',
        graphic: 'transparent',
      };
    case 'mediaText,parallax,dark':
      return {
        background: 'dark',
        content: 'transparent',
        title: 'light',
        text: 'light',
        graphic: 'transparent',
      };
    case 'mediaText,parallax,primary':
      return {
        background: 'primary',
        content: 'transparent',
        title: 'light',
        text: 'light',
        graphic: 'transparent',
      };

    default:
      return {
        background: 'light',
        content: 'dark',
        title: 'dark',
        text: 'dark',
        graphic: 'light',
      };
  }
};
export const EMPTY_CARD_MODULE_COLOR = {
  background: 'transparent',
  content: 'transparent',
  title: 'transparent',
  text: 'transparent',
  graphic: 'transparent',
};

export const areCardModuleColorEqual = (
  a: CardModuleColor,
  b: CardModuleColor,
): boolean => {
  const keys: Array<keyof CardModuleColor> = [
    'background',
    'content',
    'title',
    'text',
    'graphic',
  ];
  for (const key of keys) {
    if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
};
