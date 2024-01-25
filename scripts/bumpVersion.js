const pkg = require('../package.json');
const setWorkspaceVersions = require('./setWorkspaceVersions');

const version = pkg.version;
const [, preReleaseKind, preReleaseNumber] =
  version.match(/-([a-z]+)\.(\d+)$/) ?? [];
const [major, minor, patch] = version.split('-')[0].split('.');

let nextVersion = '';
if (preReleaseKind) {
  //prettier-ignore
  nextVersion = `${major}.${minor}.${patch}-${preReleaseKind}.${Number(preReleaseNumber) + 1}`;
} else {
  nextVersion = `${major}.${minor}.${Number(patch) + 1}`;
}

setWorkspaceVersions(nextVersion);
