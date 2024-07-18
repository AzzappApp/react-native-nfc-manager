import { getLocalizationMessagesByLocale } from '@azzapp/data';
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
