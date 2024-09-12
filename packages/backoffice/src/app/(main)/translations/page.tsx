import {
  getLocalizationMessages,
  getLocalizationMessagesByLocaleAndTarget,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET, SUPPORTED_LOCALES } from '@azzapp/i18n';
import TranslationsInfos from './TranslationsInfos';
import { appMessages, langNames, webMessages } from './translationsPageHelpers';

const TranslationsPage = async () => {
  const messages = await getLocalizationMessages();

  const messagesByLocaleAndTarget = messages.reduce(
    (acc, message) => {
      acc[message.locale] = acc[message.locale] || {};
      acc[message.locale][message.target] =
        acc[message.locale][message.target] || {};
      acc[message.locale][message.target][message.key] = message.value;
      return acc;
    },
    {} as Record<string, Record<string, Record<string, string>>>,
  );

  const nbAppMessages = Object.keys(appMessages).length;
  const nbWebMessages = Object.keys(webMessages).length;
  const nbEntityMessages = await getLocalizationMessagesByLocaleAndTarget(
    DEFAULT_LOCALE,
    ENTITY_TARGET,
  ).then(messages => messages.length);

  const translationsInfos = SUPPORTED_LOCALES.map(locale => {
    const nbTranslatedAppMessages = Object.keys(
      messagesByLocaleAndTarget[locale]?.app || {},
    ).length;
    const nbTranslatedWebMessages = Object.keys(
      messagesByLocaleAndTarget[locale]?.web || {},
    ).length;
    const nbTranslatedEntityMessages = Object.keys(
      messagesByLocaleAndTarget[locale]?.entity || {},
    ).length;
    return {
      locale,
      name: langNames[locale],
      app: {
        translated: nbTranslatedAppMessages,
        total: nbAppMessages,
      },
      web: {
        translated: nbTranslatedWebMessages,
        total: nbWebMessages,
      },
      entity: {
        translated: nbTranslatedEntityMessages,
        total: nbEntityMessages,
      },
    };
  });
  return <TranslationsInfos translationsInfos={translationsInfos} />;
};

export default TranslationsPage;
