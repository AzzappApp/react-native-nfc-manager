import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { NextResponse } from 'next/server';
import {
  getAllCardStyles,
  getAllCardTemplates,
  getCardTemplateTypes,
  getCoverTemplateTags,
  getCoverTemplateTypes,
  getLocalizationMessagesByLocale,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import appMessages from '@azzapp/i18n/src/appMessages.json';
import webMessages from '@azzapp/i18n/src/webMessages.json';
import { checkServerAuth } from '@azzapp/service/serverAuthServices';
import ERRORS from '@azzapp/shared/errors';
import { TEMPLATE_COVERTAG_DESCRIPTION_PREFIX } from '@azzapp/shared/translationsContants';
import { withPluginsRoute } from '#helpers/queries';
export const GET = withPluginsRoute(
  async (
    req: Request,
    {
      params,
    }: {
      params: { target: string };
    },
  ) => {
    try {
      await checkServerAuth(await headers());
    } catch (e) {
      if ((e as Error).message === ERRORS.INVALID_TOKEN) {
        return NextResponse.json(
          { message: ERRORS.INVALID_TOKEN },
          { status: 401 },
        );
      }
      throw e;
    }

    if (params.target === 'app') {
      return NextResponse.json(appMessages);
    } else if (params.target === 'web') {
      return NextResponse.json(webMessages);
    } else if (params.target === 'entity') {
      const entityIdsWithKind = await Promise.all([
        // CardStyleTable
        getAllCardStyles().then(cardStyles =>
          cardStyles.map(
            ({ id }) =>
              ({
                id,
                kind: 'CardStyle',
              }) as const,
          ),
        ),
        getAllCardTemplates().then(cardTemplates =>
          cardTemplates.map(
            ({ id }) =>
              ({
                id,
                kind: 'CardTemplate',
              }) as const,
          ),
        ),
        getCardTemplateTypes().then(cardTemplateTypes =>
          cardTemplateTypes.map(
            ({ id }) =>
              ({
                id,
                kind: 'CardTemplateType',
              }) as const,
          ),
        ),
        getCoverTemplateTags().then(coverTemplateTags =>
          coverTemplateTags.flatMap(({ id }) => [
            { id, kind: 'CoverTemplateTag' } as const,
            {
              id: TEMPLATE_COVERTAG_DESCRIPTION_PREFIX + id,
              kind: 'CoverTemplateTagDescription',
            },
          ]),
        ),
        getCoverTemplateTypes().then(coverTemplateTypes =>
          coverTemplateTypes.map(
            ({ id }) =>
              ({
                id,
                kind: 'CoverTemplateType',
              }) as const,
          ),
        ),
      ]);

      const defaultEntityLabels = (
        await getLocalizationMessagesByLocale(DEFAULT_LOCALE)
      ).reduce(
        (acc, message) => {
          acc[message.key] = message.value;
          return acc;
        },
        {} as Record<string, string>,
      );

      const entityMessages = entityIdsWithKind.flat().reduce(
        (acc, entity) => {
          acc[entity.id] = {
            defaultMessage: defaultEntityLabels[entity.id],
            description: `${entity.kind} ${entity.id} - Label`,
          };
          return acc;
        },
        {} as Record<
          string,
          {
            defaultMessage: string;
            description: string;
          }
        >,
      );

      return NextResponse.json(entityMessages);
    } else {
      return notFound();
    }
  },
);

export const runtime = 'nodejs';
