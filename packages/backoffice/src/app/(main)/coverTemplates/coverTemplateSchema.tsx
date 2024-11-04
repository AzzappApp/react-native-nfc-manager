import { z } from 'zod';
import { colorValidatorWithPalette } from '#helpers/validationHelpers';

export const positionSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

export const textSchema = z.object({
  text: z.enum(['firstName', 'mainName', 'custom']),
  customText: z.string().optional(),
  fontFamily: z.string(),
  color: colorValidatorWithPalette,
  fontSize: z.number(),
  width: z.number().min(1).max(200),
  rotation: z.number(),
  position: positionSchema,
  textAlign: z.enum(['left', 'right', 'center']),
  shadow: z.coerce.boolean(),
  animation: z.string().optional(),
  startPercentageTotal: z.number().min(0).max(100),
  endPercentageTotal: z.number().min(0).max(100),
});

export const coverOverlaySchema = z
  .object({
    media: z
      .object({
        id: z.string().optional(),
      })
      .optional(),
    borderWidth: z.number().min(0).max(100),
    borderColor: colorValidatorWithPalette.optional(),
    borderRadius: z.number().min(0).max(100),
    bounds: z.object({
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
      width: z.number().min(1).max(100),
      height: z.number().min(1).max(100),
    }),
    filter: z.string().optional(),
    rotation: z.number(),
    shadow: z.coerce.boolean(),
    animation: z.string().optional(),
    startPercentageTotal: z.number().min(0).max(100),
    endPercentageTotal: z.number().min(0).max(100),
  })
  .refine(
    ({ borderWidth, borderColor }) => (borderWidth > 0 ? !!borderColor : true),
    () => ({
      path: ['borderColor'],
    }),
  );

export const socialLinksSchema = z.object({
  links: z.string().optional().array().max(4),
  color: colorValidatorWithPalette,
  position: positionSchema,
  size: z.number().min(6).max(128),
});

export const coverTemplateSchema = z.object({
  id: z.string().optional(),
  preview: z.instanceof(File).optional(),
  previewId: z.string().optional(),
  name: z.string(),
  order: z.number(),
  tags: z.string().array(),
  typeId: z.string(),
  lottie: z.instanceof(File).optional(),
  mediaCount: z.number(),
  medias: z
    .object({
      index: z.number(),
      editable: z.boolean(),
      id: z.string(),
    })
    .array(),
  lottieId: z.string().optional(),
  colorPaletteId: z.string(),
  enabled: z.string(),
  params: z.object({
    textLayers: textSchema.array(),
    overlayLayers: coverOverlaySchema.array(),
    linksLayer: socialLinksSchema,
  }),
  backgroundColor: z.string().optional(),
  previewPositionPercentage: z.number().optional(),
});

export const coverTemplateSchemaWithoutfile = coverTemplateSchema
  .omit({
    lottie: true,
    preview: true,
    medias: true,
  })
  .merge(
    z.object({
      lottieId: z.string(),
      previewId: z.string(),
      params: z.object({
        textLayers: textSchema.array(),
        overlayLayers: coverOverlaySchema.array(),
        linksLayer: socialLinksSchema,
      }),
    }),
  );

export type CoverTemplateFormValue = z.infer<typeof coverTemplateSchema>;
export type TextSchemaType = z.infer<typeof textSchema>;
export type CoverOverlaySchemaType = z.infer<typeof coverOverlaySchema>;
export type SocialLinksSchemaType = z.infer<typeof socialLinksSchema>;
export type PositionSchemaType = z.infer<typeof positionSchema>;

export type CoverTemplateErrors = z.inferFlattenedErrors<
  typeof coverTemplateSchema
>;
