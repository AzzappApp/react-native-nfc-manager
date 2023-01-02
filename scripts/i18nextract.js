const fs = require('fs');
const { extract } = require('@formatjs/cli-lib');
const glob = require('fast-glob');

(async () => {
  const appMessages = JSON.parse(
    await extract(glob.sync('packages/app/lib/**/*.ts*'), {
      idInterpolationPattern: '[sha1:contenthash:base64:6]',
    }),
  );

  const webMessages = JSON.parse(
    await extract(glob.sync('packages/web/src/**/*.ts*'), {
      idInterpolationPattern: '[sha1:contenthash:base64:6]',
    }),
  );

  fs.writeFileSync(
    './packages/i18n/src/app/en.json',
    JSON.stringify(appMessages, null, 2),
  );

  fs.writeFileSync(
    './packages/i18n/src/web/en.json',
    JSON.stringify(webMessages, null, 2),
  );
})();
