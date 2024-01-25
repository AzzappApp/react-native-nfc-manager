const path = require('path');
const { createFetchLokalise } = require('./fetchLokalise');

const environment = process.argv[2];

const DEV_LANG_ISO = 'dev-lang';

const fetchLokalise = createFetchLokalise(environment);

const pushTranslations = async (messageFile, platform, includedPlatforms) => {
  const appMessages = require(messageFile);

  let remoteKeys = [];
  let page = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const resp = await fetchLokalise(`/keys?page=${page}&limit=500`);
    if (resp.error) {
      throw new Error(resp.error.message);
    }
    const { keys } = resp;
    remoteKeys = remoteKeys.concat(keys);
    if (keys.length < 500) {
      break;
    }
    page++;
  }
  console.log(`Found ${remoteKeys.length} remote keys`);
  const appKeys = Object.keys(appMessages);
  const keysToDelete = [];
  const keysToAdd = [];
  for (const key of remoteKeys) {
    if (!appKeys.includes(key.key_name[platform])) {
      if (key.platforms.includes([platform])) {
        keysToDelete.push(key.key_id);
      }
    }
  }
  for (const key of Object.keys(appMessages)) {
    if (!remoteKeys.some(({ key_name }) => key_name[platform] === key)) {
      keysToAdd.push(key);
    }
  }
  if (keysToAdd.length) {
    console.log(`Adding ${keysToAdd.length} new keys`);
    const content = {
      keys: keysToAdd.map(key => ({
        key_name: key,
        description: appMessages[key].description,
        platforms: includedPlatforms,
        translations: [
          {
            language_iso: DEV_LANG_ISO,
            translation: appMessages[key].defaultMessage,
          },
        ],
      })),
    };
    const resp = await fetchLokalise(`/keys`, {
      method: 'POST',
      body: JSON.stringify(content),
    });
    if (resp.error) {
      throw new Error(resp.error.message);
    }
  }
  if (keysToDelete.length) {
    console.log(`Deleting ${keysToDelete.length} obsolete keys`);
    const resp = await fetchLokalise(`/keys`, {
      method: 'DELETE',
      body: JSON.stringify({
        keys: keysToDelete,
      }),
    });
    if (resp.error) {
      throw new Error(resp.error.message);
    }
  }
};

(async () => {
  await pushTranslations(
    path.join(__dirname, '..', 'src/appMessages.json'),
    'ios',
    ['ios', 'android', 'other'],
  );
  await pushTranslations(
    path.join(__dirname, '..', 'src/webMessages.json'),
    'web',
    ['web'],
  );
})();
