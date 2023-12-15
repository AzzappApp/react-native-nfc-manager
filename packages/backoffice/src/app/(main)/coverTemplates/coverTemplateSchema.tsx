import { z } from 'zod';
import { colorValidatorWithPalette } from '#helpers/validationHelpers';

export const coverTemplateSchema = z.object({
  name: z.string().nonempty(),
  kind: z.union([z.literal('people'), z.literal('video'), z.literal('others')]),
  previewMedia: z.object({
    id: z.string().nonempty(),
    kind: z.union([z.literal('image'), z.literal('video')]),
  }),
  mediaAnimation: z.string().optional().nullable(),
  colorPaletteId: z.string().nonempty(),
  businessEnabled: z.boolean(),
  personalEnabled: z.boolean(),

  titleFontSize: z.number(),
  titleFontFamily: z.string(),
  titleColor: colorValidatorWithPalette,
  subTitleFontSize: z.number(),
  subTitleFontFamily: z.string(),
  subTitleColor: colorValidatorWithPalette,
  textOrientation: z.union([
    z.literal('bottomToTop'),
    z.literal('horizontal'),
    z.literal('topToBottom'),
  ]),
  textPosition: z.union([
    z.literal('bottomCenter'),
    z.literal('bottomLeft'),
    z.literal('bottomRight'),
    z.literal('middleCenter'),
    z.literal('middleLeft'),
    z.literal('middleRight'),
    z.literal('topCenter'),
    z.literal('topLeft'),
    z.literal('topRight'),
  ]),
  textAnimation: z.string().optional().nullable(),
  backgroundId: z.string().optional().nullable(),
  backgroundColor: colorValidatorWithPalette.nullable(),
  backgroundPatternColor: colorValidatorWithPalette.nullable(),
  foregroundId: z.string().optional().nullable(),
  foregroundColor: colorValidatorWithPalette.nullable(),
  mediaFilter: z.string().optional().nullable(),
  mediaParameters: z.unknown().optional().nullable(),
  merged: z.boolean(),
});

export type CoverTemplateFormValue = z.infer<typeof coverTemplateSchema>;

export type CoverTemplateErrors = z.inferFlattenedErrors<
  typeof coverTemplateSchema
>;
