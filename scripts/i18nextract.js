const fs = require('fs');
const { extract } = require('@formatjs/cli-lib');
const { stringify } = require('csv-stringify/sync');
const glob = require('fast-glob');

const extractMessage = async (globPattern, csvFile, jsonFile) => {
  const json = await extract(glob.sync(globPattern), {
    idInterpolationPattern: '[sha1:contenthash:base64:6]',
  });
  const messages = JSON.parse(json);
  const csv = stringify(
    Object.entries(messages).map(([id, { defaultMessage, description }]) => [
      id,
      defaultMessage,
      description,
    ]),
    {
      header: false,
      quoted: true,
    },
  );

  fs.writeFileSync(jsonFile, json);
  fs.writeFileSync(csvFile, csv);
};

(async () => {
  await extractMessage(
    'packages/app/src/**/*.ts*',
    './app-lang-keys.csv',
    './packages/i18n/src/appMessages.json',
  );
  await extractMessage(
    'packages/web/src/**/*.ts*',
    './web-lang-keys.csv',
    './packages/i18n/src/webMessages.json',
  );
})();
