import {
  CardStyleTable,
  CardTemplateTable,
  CardTemplateTypeTable,
  CompanyActivityTable,
  CompanyActivityTypeTable,
  CoverTemplateTagTable,
  CoverTemplateTypeTable,
  db,
  getLocalizationMessagesByLocale,
  getLocalizationMessagesByLocaleAndTarget,
  WebCardCategoryTable,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import {
  appMessages,
  langNames,
  webMessages,
} from '../translationsPageHelpers';
import LocaleTranslationsEditor from './LocaleTranslationsEditor';

type TranslationLocalePageProps = {
  params: {
    locale: string;
  };
};

const TranslationLocalePage = async ({
  params: { locale },
}: TranslationLocalePageProps) => {
  const messages = await getLocalizationMessagesByLocale(locale);
  const messagesByTarget = messages.reduce(
    (acc, message) => {
      acc[message.target] = acc[message.target] || {};
      acc[message.target][message.key] = message.value;
      return acc;
    },
    {} as Record<string, Record<string, string>>,
  );

  const defaultEntityLabels = (
    await getLocalizationMessagesByLocaleAndTarget(
      DEFAULT_LOCALE,
      ENTITY_TARGET,
    )
  ).reduce(
    (acc, message) => {
      acc[message.key] = message.value;
      return acc;
    },
    {} as Record<string, string>,
  );

  const entityIdsWithKind = await Promise.all([
    // CardStyleTable
    db
      .select({ id: CardStyleTable.id })
      .from(CardStyleTable)
      .then(cardStyles =>
        cardStyles.map(({ id }) => ({ id, kind: 'CardStyle' }) as const),
      ),
    db
      .select({ id: CardTemplateTable.id })
      .from(CardTemplateTable)
      .then(cardTemplates =>
        cardTemplates.map(({ id }) => ({ id, kind: 'CardTemplate' }) as const),
      ),
    db
      .select({ id: CardTemplateTypeTable.id })
      .from(CardTemplateTypeTable)
      .then(cardTemplateTypes =>
        cardTemplateTypes.map(
          ({ id }) => ({ id, kind: 'CardTemplateType' }) as const,
        ),
      ),
    db
      .select({ id: CompanyActivityTable.id })
      .from(CompanyActivityTable)
      .then(cardTemplates =>
        cardTemplates.map(
          ({ id }) => ({ id, kind: 'CardTemplateTag' }) as const,
        ),
      ),
    db
      .select({ id: CompanyActivityTypeTable.id })
      .from(CompanyActivityTypeTable)
      .then(cardTemplates =>
        cardTemplates.map(
          ({ id }) => ({ id, kind: 'CardTemplateTag' }) as const,
        ),
      ),
    db
      .select({ id: CoverTemplateTagTable.id })
      .from(CoverTemplateTagTable)
      .then(cardTemplates =>
        cardTemplates.map(
          ({ id }) => ({ id, kind: 'CardTemplateTag' }) as const,
        ),
      ),
    db
      .select({ id: CoverTemplateTypeTable.id })
      .from(CoverTemplateTypeTable)
      .then(cardTemplates =>
        cardTemplates.map(
          ({ id }) => ({ id, kind: 'CardTemplateType' }) as const,
        ),
      ),
    db
      .select({ id: WebCardCategoryTable.id })
      .from(WebCardCategoryTable)
      .then(cardTemplates =>
        cardTemplates.map(
          ({ id }) => ({ id, kind: 'WebCardCategory' }) as const,
        ),
      ),
  ]);

  const entityMessages = entityIdsWithKind.flat().reduce(
    (acc, entity) => {
      acc[entity.id] = {
        defaultMessage: defaultEntityLabels[entity.id],
        description: entity.kind,
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

  const messagesSet = [
    {
      title: 'App',
      target: 'app',
      messages: messagesByTarget.app || {},
      defaultMessages: appMessages,
    },
    {
      title: 'Web',
      target: 'web',
      messages: messagesByTarget.web || {},
      defaultMessages: webMessages,
    },
    {
      title: 'Entity',
      target: 'entity',
      messages: messagesByTarget.entity || {},
      defaultMessages: entityMessages,
    },
  ];

  return (
    <LocaleTranslationsEditor
      title={langNames[locale as keyof typeof langNames]}
      locale={locale}
      messagesSet={messagesSet}
    />
  );
};

export default TranslationLocalePage;
