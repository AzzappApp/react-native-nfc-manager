import {
  getAllCardStyles,
  getAllCardTemplates,
  getCardTemplateTypes,
  getCompanyActivities,
  getCompanyActivityTypes,
  getCoverTemplateTags,
  getCoverTemplateTypes,
  getLocalizationMessagesByLocale,
  getLocalizationMessagesByLocaleAndTarget,
  getWebCardCategories,
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
    getAllCardStyles().then(cardStyles =>
      cardStyles.map(({ id }) => ({ id, kind: 'CardStyle' }) as const),
    ),
    getAllCardTemplates().then(cardTemplates =>
      cardTemplates.map(({ id }) => ({ id, kind: 'CardTemplate' }) as const),
    ),
    getCardTemplateTypes().then(cardTemplateTypes =>
      cardTemplateTypes.map(
        ({ id }) => ({ id, kind: 'CardTemplateType' }) as const,
      ),
    ),
    getCompanyActivities().then(companyActivity =>
      companyActivity.map(
        ({ id }) => ({ id, kind: 'CompanyActivity' }) as const,
      ),
    ),
    getCompanyActivityTypes().then(companyActivityTypes =>
      companyActivityTypes.map(
        ({ id }) => ({ id, kind: 'CompanyActivityType' }) as const,
      ),
    ),
    getCoverTemplateTags().then(coverTemplateTags =>
      coverTemplateTags.map(
        ({ id }) => ({ id, kind: 'CoverTemplateTag' }) as const,
      ),
    ),
    getCoverTemplateTypes().then(coverTemplateTypes =>
      coverTemplateTypes.map(
        ({ id }) => ({ id, kind: 'CoverTemplateType' }) as const,
      ),
    ),
    getWebCardCategories().then(cardCategories =>
      cardCategories.map(
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
