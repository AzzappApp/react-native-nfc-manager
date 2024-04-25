import * as Sentry from '@sentry/nextjs';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { withAxiom } from 'next-axiom';
import * as z from 'zod';
import { updateLabel } from '@azzapp/data';

const TranslationUpdatedSchema = z.union([
  z.object({
    event: z.literal('project.translation.updated'),
    key: z.object({
      name: z.string(),
    }),
    language: z.object({
      iso: z.string(),
    }),
    translation: z.object({
      value: z.string(),
    }),
    project: z.object({
      id: z.string(),
      name: z.string(),
      branch: z.string(),
    }),
  }),
  z.object({
    event: z.literal('project.translations.updated'),
    translations: z.array(
      z.object({
        key: z.object({
          name: z.string(),
        }),
        value: z.string(),
        language: z.object({
          iso: z.string(),
        }),
      }),
    ),
    project: z.object({
      id: z.string(),
      name: z.string(),
      branch: z.string(),
    }),
    user: z.object({
      full_name: z.string(),
      email: z.string(),
    }),
  }),
]);

const ENVIRONMENT = process.env.NEXT_PUBLIC_PLATFORM || 'development';

const AZZAPP_SERVER_LOKALISE_HEADER = 'x-lokalise-azzapp';

const TOKEN = process.env.WEBHOOK_LOKALISE_API_KEY;

export const POST = withAxiom(async (req: Request) => {
  const token = headers().get(AZZAPP_SERVER_LOKALISE_HEADER) ?? null;

  if (token === TOKEN) {
    try {
      const body = await req.json();

      const input = TranslationUpdatedSchema.safeParse(body);

      if (input.success) {
        const readData =
          ENVIRONMENT === 'production'
            ? input.data.project.branch === 'stable'
            : input.data.project.branch !== 'stable';

        if (input.data.event === 'project.translation.updated') {
          if (readData) {
            const key = input.data.key.name;

            await updateLabel(
              key,
              input.data.language.iso.replace('_', '-'),
              input.data.translation.value,
            );
          }
        } else {
          await Promise.all(
            input.data.translations.map(translation => {
              if (readData) {
                return updateLabel(
                  translation.key.name,
                  translation.language.iso.replace('_', '-'),
                  translation.value,
                );
              }
              return Promise.resolve();
            }),
          );
        }
      }
    } catch (error) {
      //unrecognized body
      Sentry.captureException(error);
    }
  }

  return NextResponse.json({ message: 'ok' }, { status: 200 });
});
