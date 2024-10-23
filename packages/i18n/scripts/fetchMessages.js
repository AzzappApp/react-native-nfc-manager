const fs = require('fs');
const path = require('path');

const TRANSLATION_APP_API_ENDPOINT = process.env.TRANSLATION_APP_API_ENDPOINT;
const API_SERVER_TOKEN = process.env.API_SERVER_TOKEN;
const ENVIRONMENT = process.env.NEXT_PUBLIC_PLATFORM;

// TODO duplicated from i18nConfig.ts but I don't want to import typescript in this script
const SUPPORTED_LOCALES = ['en-US', 'fr'];

const fetchMessages = async (sourceId, messagesDir, appMessages) => {
  let messages = [];
  try {
    const response = await fetch(
      `${TRANSLATION_APP_API_ENDPOINT}/messages/${sourceId}/${ENVIRONMENT === 'development' ? 'staging' : ENVIRONMENT}`, //fallback to staging in dev env
      {
        headers: {
          'azzapp-server-auth': API_SERVER_TOKEN,
        },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    messages = await response.json();
  } catch (e) {
    console.warn(
      'Failed to fetch messages from translation app, using default messages',
      e,
    );
  }

  if (!fs.existsSync(messagesDir)) {
    fs.mkdirSync(messagesDir, { recursive: true });
  }
  const messagesByLocale = messages.reduce((acc, message) => {
    const { locale, key, value } = message;
    if (!acc[locale]) {
      acc[locale] = {};
    }
    acc[locale][key] = value;
    return acc;
  }, {});

  SUPPORTED_LOCALES.forEach(locale => {
    if (!messagesByLocale[locale]) {
      messagesByLocale[locale] = {};
    }
  });

  Object.entries(appMessages).forEach(([key, { defaultMessage }]) => {
    Object.entries(messagesByLocale).forEach(([, messages]) => {
      if (!messages[key]) {
        messages[key] = defaultMessage;
      }
    });
  });

  Object.entries(messagesByLocale).forEach(([locale, messages]) => {
    const messagesPath = path.resolve(messagesDir, `${locale}.json`);
    fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));
  });
};

(async () => {
  await fetchMessages(
    'azzapp-app',
    path.resolve(__dirname, '..', 'src', 'app'),
    require('../src/appMessages.json'),
  );
  await fetchMessages(
    'azzapp-web',
    path.resolve(__dirname, '..', 'src', 'web'),
    require('../src/webMessages.json'),
  );
  process.exit(0);
})();
