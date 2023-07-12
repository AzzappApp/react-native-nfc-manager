const pkg = require('../package.json');
const setWorkspaceVersions = require('./setWorkspaceVersions');

const preReleaseKind = process.argv[2];

if (preReleaseKind && !preReleaseKind.match(/^[a-z]+$/)) {
  console.error('Please provide a valid pre-release kind');
  process.exit(1);
}

const version = pkg.version;
const [, currentPreReleaseKind, preReleaseNumber] =
  version.match(/-([a-z]+)\.(\d)+$/) ?? [];
const [major, minor, patch] = version.split('-')[0].split('.');

let nextVersion = '';
if (preReleaseKind && currentPreReleaseKind === preReleaseKind) {
  //prettier-ignore
  nextVersion = `${major}.${minor}.${patch}-${preReleaseKind}.${Number(preReleaseNumber) + 1}`;
} else if (preReleaseKind) {
  nextVersion = `${major}.${minor}.${Number(patch) + 1}-${preReleaseKind}.0`;
} else {
  nextVersion = `${major}.${minor}.${Number(patch) + 1}`;
}

setWorkspaceVersions(nextVersion);
