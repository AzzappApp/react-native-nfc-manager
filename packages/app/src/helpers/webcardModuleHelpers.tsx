import {
  MODULE_KIND_MAP,
  MODULE_KIND_MEDIA,
  MODULE_KIND_MEDIA_TEXT,
  MODULE_KIND_MEDIA_TEXT_LINK,
  MODULE_KIND_TITLE_TEXT,
} from '@azzapp/shared/cardModuleHelpers';

export const MODULE_KIND_WITH_VARIANTS = [
  {
    moduleKind: MODULE_KIND_MEDIA,
    variants: [
      'slideshow',
      'parallax',
      'original',
      'fullscreen',
      'grid',
      'original_slideshow',
      'full_slideshow',
      'full_grid',
      'zoom_out_fade',
      'parallax_small',
    ],
  },
  {
    moduleKind: MODULE_KIND_MEDIA_TEXT,
    variants: [
      'parallax',
      'alternation',
      'full_alternation',
      'article',
      'grid',
      'superposition',
      'card',
      'card_gradient',
    ],
  },
  {
    moduleKind: MODULE_KIND_MEDIA_TEXT_LINK,
    variants: [
      'alternation',
      'parallax',
      'full_alternation',
      'article',
      'button_round',
      'button_square',
      'list',
      'card',
      'card_gradient',
      'grid',
    ],
  },
  {
    moduleKind: MODULE_KIND_MAP,
    variants: [
      'map_s',
      'map_m',
      'map_l',
      'map_s_full',
      'map_m_full',
      'map_l_full',
    ],
  },
  {
    moduleKind: MODULE_KIND_TITLE_TEXT,
    variants: [
      'left',
      'center',
      'right',
      'justified',
      'column_1',
      'column_1_justified',
      'column_2',
      'column_2_justified',
      'column_3',
      'column_3_justified',
      'column_4',
      'column_4_justified',
    ],
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

export const isComingSoonModule = (module: ModuleKindAndVariant) => {
  switch (module.moduleKind) {
    case MODULE_KIND_MEDIA: {
      const soon = [
        'fullscreen',
        'grid',
        'original_slideshow',
        'full_slideshow',
        'full_grid',
        'zoom_out_fade',
        'parallax_small',
      ];
      return soon.includes(module.variant);
    }
    case MODULE_KIND_MEDIA_TEXT: {
      const soon = [
        'original',
        'fullscreen',
        'full_alternation',
        'article',
        'grid',
        'superposition',
        'card',
        'card_gradient',
      ];
      return soon.includes(module.variant);
    }
    case MODULE_KIND_MEDIA_TEXT_LINK: {
      const soon = [
        'original',
        'fullscreen',
        'full_alternation',
        'article',
        'button_round',
        'button_square',
        'list',
        'superposition',
        'card',
        'card_gradient',
        'grid',
      ];
      return soon.includes(module.variant);
    }
    case MODULE_KIND_MAP:
    case MODULE_KIND_TITLE_TEXT:
      return true;
    default:
      return false;
  }
};
