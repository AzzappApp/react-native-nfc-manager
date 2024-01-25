const fs = require('fs');
const path = require('path');
const { SUPPORTED_LOCALES } = require('../index');
const { createFetchLokalise } = require('./fetchLokalise');

const environment = process.argv[2];

const fetchLokalise = createFetchLokalise(environment);

const pullTranslations = async (platform, dir) => {
  let page = 1;
  let remoteKeys = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const resp = await fetchLokalise(
      `/keys?filter_platforms=${platform}&include_translations=1&page=${page}&limit=500`,
    );
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
  console.log(`Fetched ${remoteKeys.length} keys for ${platform}`);

  const table = SUPPORTED_LOCALES.reduce(
    (acc, locale) => ({
      ...acc,
      [locale]: {},
    }),
    {},
  );
  for (const key of remoteKeys) {
    const { key_name, translations } = key;
    for (const locale of SUPPORTED_LOCALES) {
      const translation = translations.find(
        ({ language_iso }) => language_iso === locale,
      );
      if (translation) {
        table[locale][key_name[platform]] = translation.translation;
      }
    }
  }
  for (const locale of SUPPORTED_LOCALES) {
    fs.writeFileSync(
      path.join(dir, `${locale}.json`),
      JSON.stringify(table[locale], null, 2),
    );
  }
};

(async () => {
  await pullTranslations('ios', path.resolve(__dirname, '..', 'src', 'app'));
  await pullTranslations('web', path.resolve(__dirname, '..', 'src', 'web'));
})();
