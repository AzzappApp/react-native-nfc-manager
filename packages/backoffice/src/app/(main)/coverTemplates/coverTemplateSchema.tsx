import { z } from 'zod';
import { colorValidatorWithPalette } from '#helpers/validationHelpers';

export const animationSchema = z.object({
  name: z.string().optional(),
  start: z.number().min(0).max(100),
  end: z.number().min(0).max(100),
});

export const textSchema = z.object({
  text: z.union([
    z.literal('firstName'),
    z.literal('mainName'),
    z.literal('custom'),
  ]),
  customText: z.string().optional(),
  fontFamily: z.string(),
  color: colorValidatorWithPalette,
  fontSize: z.number(),
  width: z.number().min(1).max(100),
  orientation: z.number(),
  position: z.object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
  }),
  animation: animationSchema,
});

export const coverOverlaySchema = z.object({
  image: z.instanceof(File).optional(),

  media: z
    .object({
      id: z.string().optional(),
    })
    .optional(),
  borderWidth: z.number().min(0).max(100),
  borderColor: colorValidatorWithPalette,
  borderRadius: z.number().min(0).max(100),
  bounds: z.object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    width: z.number().min(1).max(100),
    height: z.number().min(1).max(100),
  }),
  filter: z.string(),
  rotation: z.number(),
  // animation: animationSchema,
});

export const socialLinksSchema = z.object({
  links: z.string().optional().array().max(4),
  color: colorValidatorWithPalette,
});

export const mediasSchema = z.object({
  id: z.string(),
  filter: z.string().optional(),
});

export const coverTemplateSchema = z.object({
  id: z.string().optional(),
  preview: z.instanceof(File).optional(),
  previewId: z.string().optional(),
  name: z.string(),
  order: z.number(),
  tags: z.string().array(),
  type: z.string(),
  lottie: z.instanceof(File).optional(),
  lottieId: z.string().optional(),
  colorPaletteId: z.string(),
  enabled: z.string(),
  params: z.object({
    medias: mediasSchema.array(),
    textLayers: textSchema.array(),
    overlayLayers: coverOverlaySchema.array(),
    linksLayer: socialLinksSchema,
  }),
});

export const coverTemplateSchemaWithoutfile = coverTemplateSchema
  .omit({
    lottie: true,
    preview: true,
  })
  .merge(
    z.object({
      lottieId: z.string(),
      previewId: z.string(),
      params: z.object({
        medias: mediasSchema.array(),
        textLayers: textSchema.array(),
        overlayLayers: coverOverlaySchema
          .omit({
            image: true,
          })
          .array(),
        linksLayer: socialLinksSchema,
      }),
    }),
  );

export type CoverTemplateFormValue = z.infer<typeof coverTemplateSchema>;
export type TextSchemaType = z.infer<typeof textSchema>;
export type CoverOverlaySchemaType = z.infer<typeof coverOverlaySchema>;
export type SocialLinksSchemaType = z.infer<typeof socialLinksSchema>;
export type MediasSchemaType = z.infer<typeof mediasSchema>;

export type CoverTemplateErrors = z.inferFlattenedErrors<
  typeof coverTemplateSchema
>;
