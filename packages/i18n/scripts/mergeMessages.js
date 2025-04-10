const API_SERVER_TOKEN = process.env.API_SERVER_TOKEN;

const TRANSLATION_APP_API_ENDPOINT = process.env.TRANSLATION_APP_API_ENDPOINT;

const mergeMessage = sourceId =>
  fetch(`${TRANSLATION_APP_API_ENDPOINT}/messages/${sourceId}/merge`, {
    method: 'POST',
    headers: {
      'azzapp-translation-auth': API_SERVER_TOKEN,
    },
    body: JSON.stringify({
      fromEnvironment: 'staging',
      toEnvironment: 'production',
    }),
  });

(async () => {
  const result = await Promise.allSettled([
    mergeMessage('app'),
    mergeMessage('web'),
    mergeMessage('azzapp-users-manager'),
  ]);

  const foundRejected = result.find(({ status }) => status === 'rejected');
  if (foundRejected) {
    console.error('Failed to merge messages');
    console.error(foundRejected.reason);
    process.exit(1);
  }

  process.exit(0);
})();
