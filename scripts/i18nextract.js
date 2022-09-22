const fs = require('fs');
const path = require('path');
const { extract } = require('@formatjs/cli-lib');
const dependencyTree = require('dependency-tree');
const glob = require('fast-glob');
const { flatten, uniq, mapValues } = require('lodash');

const stripFileInfo = messages =>
  mapValues(messages, ({ defaultMessage, description }) => ({
    defaultMessage,
    description,
  }));

(async () => {
  const appMessages = JSON.parse(
    await extract(glob.sync('packages/app/lib/**/*.ts*'), {
      extractSourceLocation: true,
      idInterpolationPattern: '[sha1:contenthash:base64:6]',
    }),
  );

  const webMessages = JSON.parse(
    await extract(glob.sync('packages/web/src/**/*.ts*'), {
      extractSourceLocation: true,
      idInterpolationPattern: '[sha1:contenthash:base64:6]',
    }),
  );

  fs.writeFileSync(
    './packages/i18n/src/app/en.json',
    JSON.stringify(stripFileInfo(appMessages), null, 2),
  );

  fs.writeFileSync(
    './packages/i18n/src/web/en.json',
    JSON.stringify(stripFileInfo(webMessages), null, 2),
  );

  const fileMessageMap = {};
  Object.entries({ ...appMessages, ...webMessages }).forEach(
    ([id, { file }]) => {
      if (!fileMessageMap[file]) {
        fileMessageMap[file] = [];
      }
      fileMessageMap[file].push(id);
    },
  );

  const pagesMessagesDependencies = {};
  const pages = glob.sync('packages/web/src/**/pages/**/*.ts*');
  pages.forEach(page => {
    const pageId = page
      .replace('packages/web/src/pages/', '')
      .replace(/.tsx?/g, '');
    if (pageId.startsWith('_') || pageId.startsWith('api/')) {
      return;
    }

    pagesMessagesDependencies[pageId] = uniq(
      flatten(
        dependencyTree
          .toList({
            filename: page,
            directory: path.join(__dirname, '..'),
            filter: path =>
              path.indexOf('node_modules') === -1 && !path.endsWith('.d.ts'),
            tsConfig: path.join(__dirname, '..', './tsconfig.json'),
          })
          .concat(page)
          .map(file => path.relative(process.cwd(), file))
          .map(file => fileMessageMap[file])
          .filter(messages => !!messages),
      ),
    );
  });

  fs.writeFileSync(
    './packages/i18n/pagesMessagesDependencies.json',
    JSON.stringify(pagesMessagesDependencies, null, 4),
  );
})();
