import {
  MODULE_KIND_MEDIA,
  MODULE_KIND_MEDIA_TEXT,
  MODULE_KIND_MEDIA_TEXT_LINK,
} from '@azzapp/shared/cardModuleHelpers';

export const MODULE_KIND_WITH_VARIANTS = [
  {
    moduleKind: MODULE_KIND_MEDIA,
    variants: ['slideshow', 'parallax'],
  },
  {
    moduleKind: MODULE_KIND_MEDIA_TEXT,
    variants: ['alternation', 'parallax'],
  },
  {
    moduleKind: MODULE_KIND_MEDIA_TEXT_LINK,
    variants: ['alternation', 'parallax'],
  },
  //INSERT_MODULE
] as const;

export const MODULE_KIND_WITHOUT_VARIANTS = [
  'photoWithTextAndTitle',
  'socialLinks',
  'carousel',
  'simpleButton',
  'horizontalPhoto',
  'lineDivider',
  'simpleTitle',
  'simpleText',
  'blockText',
] as const;

/* old module (V1 with full customisation)  */
export const isCustomModule = (
  moduleKind: string,
): moduleKind is ModuleKindWithoutVariants => {
  return MODULE_KIND_WITHOUT_VARIANTS.includes(
    moduleKind as ModuleKindWithoutVariants,
  );
};

export type ModuleKindWithVariants = (typeof MODULE_KIND_WITH_VARIANTS)[number];
export type ModuleKindWithoutVariants =
  (typeof MODULE_KIND_WITHOUT_VARIANTS)[number];

export type ModuleKindAndVariant = {
  [S in ModuleKindWithVariants as S['moduleKind']]: {
    moduleKind: S['moduleKind'];
    variant: S['variants'][number];
  };
}[ModuleKindWithVariants['moduleKind']];

export type ModuleKindHasVariants = ModuleKindWithVariants['moduleKind'];

export type Variant<T extends ModuleKindHasVariants> =
  T extends ModuleKindAndVariant['moduleKind']
    ? Extract<ModuleKindAndVariant, { moduleKind: T }>['variant']
    : never;

export type ModuleKindWithVariant =
  | ModuleKindAndVariant
  | {
      moduleKind: ModuleKindWithoutVariants;
      variant: never;
    };
export const MODULE_VARIANT_SECTION = [
  ...MODULE_KIND_WITH_VARIANTS.map(({ moduleKind, variants }) => ({
    section: moduleKind,
    variants,
  })),
  {
    section: 'custom',
    moduleKind: [
      'photoWithTextAndTitle',
      'socialLinks',
      'carousel',
      'simpleButton',
      'horizontalPhoto',
      'lineDivider',
      'simpleTitle',
      'simpleText',
      'blockText',
    ],
  },
] as const;

export type ModuleKindSection = (typeof MODULE_VARIANT_SECTION)[number];

export type ModuleKindSectionName = ModuleKindSection['section'];
