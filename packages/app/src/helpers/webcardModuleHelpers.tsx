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
      'grid',
      'square_grid',
      'grid2',
      'square_grid2',
      'original',
      'fullscreen',
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
      'alternation',
      'parallax',
      'full_alternation',
      'simple_carousel',
      'grid',
      'article',
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
      'grid',
      'article',
      'button_round',
      'button_square',
      'list',
      'card',
      'card_gradient',
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

//using is module supported naming, (opposite of isCoomingSoon) in case of older app
// accessing the webcard, not in the list for avoiding crash
export const isModuleVariantSupported = (module: {
  moduleKind: string;
  variant: string | null;
}) => {
  if (!module.variant) {
    //this is the list of  customizable module without variant
    return [
      'photoWithTextAndTitle',
      'socialLinks',
      'blockText',
      'carousel',
      'horizontalPhoto',
      'lineDivider',
      'simpleButton',
      'simpleText',
      'simpleTitle',
    ].includes(module.moduleKind);
  }
  switch (module.moduleKind) {
    case MODULE_KIND_MEDIA: {
      const supported = [
        'slideshow',
        'parallax',
        'grid',
        'square_grid',
        'grid2',
        'square_grid2',
        'original',
        // 'fullscreen',
        // 'original_slideshow',
        // 'full_slideshow',
        // 'full_grid',
        // 'zoom_out_fade',
        // 'parallax_small',
      ];
      return supported.includes(module.variant);
    }
    case MODULE_KIND_MEDIA_TEXT: {
      const supported = [
        'alternation',
        'parallax',
        'full_alternation',
        'original',
        'simple_carousel',
        // 'fullscreen',
        // 'article',
        // 'grid',
        // 'superposition',
        // 'card',
        // 'card_gradient',
      ];
      return supported.includes(module.variant);
    }
    case MODULE_KIND_MEDIA_TEXT_LINK: {
      const supported = [
        'alternation',
        'parallax',
        'full_alternation',
        'original',
        // 'grid',
        // 'fullscreen',
        // 'article',
        // 'button_round',
        // 'button_square',
        // 'list',
        // 'superposition',
        // 'card',
        // 'card_gradient',
      ];
      return supported.includes(module.variant);
    }
    case MODULE_KIND_MAP:
      return false;
    case MODULE_KIND_TITLE_TEXT: {
      const supported = [
        'left',
        'center',
        'right',
        'justified',
        // 'column_1',
        // 'column_1_justified',
        // 'column_2',
        // 'column_2_justified',
        // 'column_3',
        // 'column_3_justified',
        // 'column_4',
        // 'column_4_justified',
      ];
      return supported.includes(module.variant);
    }
    //INSERT_MODULE
    default:
      return false;
  }
};
