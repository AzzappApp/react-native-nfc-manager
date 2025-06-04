const API_SERVER_TOKEN = process.env.API_SERVER_TOKEN;

const TRANSLATION_APP_API_ENDPOINT = process.env.TRANSLATION_APP_API_ENDPOINT;

const ENVIRONMENT = process.env.DEPLOYMENT_ENVIRONMENT ?? 'development';

const purgeMessages = async () => {
  const webMessages = require(`../src/webMessages.json`);
  const appMessages = require(`../src/appMessages.json`);

  await Promise.all([
    fetch(
      `${TRANSLATION_APP_API_ENDPOINT}/messages/web/${ENVIRONMENT === 'development' ? 'staging' : ENVIRONMENT}/purge`, //fallback to staging in dev env
      {
        headers: {
          'azzapp-translation-auth': API_SERVER_TOKEN,
        },
      },
      {
        method: 'POST',
        body: JSON.stringify({
          usedKeys: Object.keys(webMessages),
        }),
      },
    ),
    fetch(
      `${TRANSLATION_APP_API_ENDPOINT}/messages/app/${ENVIRONMENT === 'development' ? 'staging' : ENVIRONMENT}/purge`, //fallback to staging in dev env
      {
        headers: {
          'azzapp-translation-auth': API_SERVER_TOKEN,
        },
      },
      {
        method: 'POST',
        body: JSON.stringify({
          usedKeys: Object.keys(appMessages),
        }),
      },
    ),
  ]);
};

(async () => {
  await purgeMessages();
  process.exit(0);
})();
