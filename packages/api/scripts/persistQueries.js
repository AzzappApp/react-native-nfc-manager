const fs = require('fs');
const path = require('path');
const semver = require('semver');
const internal = require('../internal-version.json');
const pkg = require('../package.json');

const currentVersion = `${pkg.version}-${internal.kind}.${internal.version}`;

const PERSISTED_QUERIES_DIR = path.join(__dirname, '../persistedQueries');
const CURRENT_PERSISTED_QUERIES_MAP_FILE = path.join(
  __dirname,
  '..',
  'src',
  'persisted-query-map.json',
);
const LAST_SUPPORTED_APP_VERSION =
  process.env.LAST_SUPPORTED_APP_VERSION || currentVersion;

const updatePersistedQueriesMap = () => {
  fs.copyFileSync(
    CURRENT_PERSISTED_QUERIES_MAP_FILE,
    path.join(PERSISTED_QUERIES_DIR, `${currentVersion}.json`),
  );

  const map = {};
  fs.readdirSync(PERSISTED_QUERIES_DIR).forEach(file => {
    if (!file.endsWith('.json')) {
      return;
    }
    const fileVersion = file.replace('.json', '');
    if (
      semver.gte(
        removePreRelease(fileVersion),
        removePreRelease(LAST_SUPPORTED_APP_VERSION),
      ) &&
      prereleaseToNumber(getPrerelease(fileVersion)) >=
        prereleaseToNumber(getPrerelease(currentVersion))
    ) {
      Object.assign(map, require(path.join(PERSISTED_QUERIES_DIR, file)));
    } else {
      fs.unlinkSync(path.join(PERSISTED_QUERIES_DIR, file));
    }
  });

  fs.writeFileSync(
    CURRENT_PERSISTED_QUERIES_MAP_FILE,
    JSON.stringify(map, null, 2),
  );
};

const removePreRelease = version => {
  const versionParts = version.split('-');
  return versionParts[0];
};

const prereleaseToNumber = prerelease => {
  if (!prerelease) {
    return Infinity;
  }
  return {
    canary: 100,
    alpha: 200,
    beta: 300,
    rc: 400,
  }[prerelease];
};

const getPrerelease = version => {
  const versionParts = version.split('-');
  return versionParts[1]?.split('.')[0] ?? null;
};

updatePersistedQueriesMap();
