import type { ModuleKindAndVariant } from './webcardModuleHelpers';
import type { CardModuleColor } from '@azzapp/shared/cardModuleHelpers';

export const dyptichByModuleVariant = (
  module: ModuleKindAndVariant,
): CardModuleColor[] | null => {
  switch (module.moduleKind) {
    case 'media':
      switch (module.variant) {
        case 'original':
        case 'square_grid':
        case 'grid':
        case 'square_grid2':
        case 'grid2':
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
        default:
          return [
            {
              background: 'light',
              content: 'dark',
              title: 'dark',
              text: 'dark',
              graphic: 'light',
            },
          ];
      }
      break;
    case 'mediaText':
      switch (module.variant) {
        case 'alternation':
        case 'full_alternation':
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
        default:
          return [
            {
              background: 'light',
              content: 'dark',
              title: 'dark',
              text: 'dark',
              graphic: 'light',
            },
          ];
      }
      break;
    case 'mediaTextLink':
      switch (module.variant) {
        case 'alternation':
        case 'full_alternation':
          return [
            {
              background: 'light',
              content: 'primary',
              title: 'dark',
              text: 'dark',
              graphic: 'light',
            },
            {
              background: 'light',
              content: 'dark',
              title: 'dark',
              text: 'dark',
              graphic: 'light',
            },
            {
              background: 'light',
              content: 'dark',
              title: 'primary',
              text: 'dark',
              graphic: 'light',
            },
            {
              background: 'dark',
              content: 'primary',
              title: 'light',
              text: 'light',
              graphic: 'light',
            },
            {
              background: 'dark',
              content: 'light',
              title: 'light',
              text: 'light',
              graphic: 'dark',
            },
            {
              background: 'dark',
              content: 'light',
              title: 'primary',
              text: 'light',
              graphic: 'dark',
            },
            {
              background: 'primary',
              content: 'light',
              title: 'light',
              text: 'light',
              graphic: 'dark',
            },
            {
              background: 'primary',
              content: 'dark',
              title: 'light',
              text: 'light',
              graphic: 'light',
            },
            {
              background: 'primary',
              content: 'dark',
              title: 'dark',
              text: 'dark',
              graphic: 'light',
            },
            {
              background: 'primary',
              content: 'light',
              title: 'dark',
              text: 'dark',
              graphic: 'dark',
            },
          ];
        case 'parallax':
          return [
            {
              background: 'dark',
              content: 'light',
              title: 'light',
              text: 'light',
              graphic: 'dark',
            },
            {
              background: 'dark',
              content: 'primary',
              title: 'light',
              text: 'light',
              graphic: 'light',
            },
            {
              background: 'light',
              content: 'dark',
              title: 'dark',
              text: 'dark',
              graphic: 'light',
            },
            {
              background: 'light',
              content: 'primary',
              title: 'dark',
              text: 'dark',
              graphic: 'light',
            },
            {
              background: 'primary',
              content: 'dark',
              title: 'dark',
              text: 'dark',
              graphic: 'light',
            },
            {
              background: 'primary',
              content: 'light',
              title: 'dark',
              text: 'dark',
              graphic: 'dark',
            },
            {
              background: 'primary',
              content: 'light',
              title: 'light',
              text: 'light',
              graphic: 'dark',
            },
            {
              background: 'primary',
              content: 'dark',
              title: 'light',
              text: 'light',
              graphic: 'light',
            },
          ];
        default:
          return [
            {
              background: 'light',
              content: 'dark',
              title: 'dark',
              text: 'dark',
              graphic: 'light',
            },
          ];
      }
      break;
    case 'titleText':
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
  const { moduleKind, variant } = module;
  //Maybe we should separate with 2or 3 swithc ase instead of composing

  switch (moduleKind) {
    case 'media':
      switch (variant) {
        case 'original':
        case 'grid':
        case 'square_grid':
        case 'grid2':
        case 'square_grid2':
        case 'slideshow':
          switch (coverBackgroundColor) {
            case 'dark':
              return {
                background: 'dark',
                content: 'transparent',
                title: 'transparent',
                text: 'transparent',
                graphic: 'transparent',
              };
            case 'light':
              return {
                background: 'light',
                content: 'transparent',
                title: 'transparent',
                text: 'transparent',
                graphic: 'transparent',
              };
            case 'primary':
              return {
                background: 'primary',
                content: 'transparent',
                title: 'transparent',
                text: 'transparent',
                graphic: 'transparent',
              };
          }
          break;
        case 'parallax':
          return EMPTY_CARD_MODULE_COLOR;
      }
      break;

    case 'mediaText':
      switch (variant) {
        case 'alternation':
          switch (coverBackgroundColor) {
            case 'light':
              return {
                background: 'light',
                content: 'transparent',
                title: 'dark',
                text: 'dark',
                graphic: 'transparent',
              };
            case 'dark':
              return {
                background: 'dark',
                content: 'transparent',
                title: 'light',
                text: 'light',
                graphic: 'transparent',
              };
            case 'primary':
              return {
                background: 'primary',
                content: 'transparent',
                title: 'dark',
                text: 'dark',
                graphic: 'transparent',
              };
          }
          break;
        case 'parallax':
          return {
            background: 'dark',
            content: 'transparent',
            title: 'light',
            text: 'light',
            graphic: 'transparent',
          };
      }
      break;

    case 'mediaTextLink':
      switch (variant) {
        case 'alternation':
          switch (coverBackgroundColor) {
            case 'light':
              return {
                background: 'light',
                content: 'primary',
                title: 'dark',
                text: 'dark',
                graphic: 'light',
              };
            case 'dark':
              return {
                background: 'dark',
                content: 'primary',
                title: 'light',
                text: 'light',
                graphic: 'light',
              };
            case 'primary':
              return {
                background: 'primary',
                content: 'light',
                title: 'light',
                text: 'light',
                graphic: 'dark',
              };
          }
          break;
        case 'parallax':
          return {
            background: 'dark',
            content: 'light',
            title: 'light',
            text: 'light',
            graphic: 'dark',
          };
      }
      break;

    case 'titleText':
      switch (coverBackgroundColor) {
        case 'light':
          return {
            background: 'light',
            content: 'transparent',
            title: 'dark',
            text: 'dark',
            graphic: 'transparent',
          };
        case 'dark':
          return {
            background: 'dark',
            content: 'transparent',
            title: 'light',
            text: 'light',
            graphic: 'transparent',
          };
        case 'primary':
          return {
            background: 'primary',
            content: 'transparent',
            title: 'dark',
            text: 'dark',
            graphic: 'transparent',
          };
      }
      break;
    default:
      return {
        background: 'light',
        content: 'dark',
        title: 'dark',
        text: 'dark',
        graphic: 'light',
      };
  }
  return {
    background: 'light',
    content: 'dark',
    title: 'dark',
    text: 'dark',
    graphic: 'light',
  };
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
