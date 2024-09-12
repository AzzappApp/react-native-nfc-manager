const pkg = require('../package.json');
const setWorkspaceVersions = require('./setWorkspaceVersions');

const preReleaseKind = process.argv[2];

if (preReleaseKind && !preReleaseKind.match(/^[a-z]+$/)) {
  console.error('Please provide a valid pre-release kind');
  process.exit(1);
}

const version = pkg.version;
const [, , preReleaseNumber] = version.match(/-([a-z]+)\.(\d+)$/) ?? [];
const [major, minor, patch] = version.split('-')[0].split('.');
const paddedMinor = minor.padStart(2, '0');

let nextVersion = '';
let androidVersionCode = 0;

if (preReleaseKind) {
  const paddedPatch = patch.padStart(2, '0');
  const nextPreReleaseNumber = (Number(preReleaseNumber) + 1).toString();
  nextVersion = `${major}.${minor}.${patch}-${preReleaseKind}.${nextPreReleaseNumber}`;
  androidVersionCode = `${major}${paddedMinor}${paddedPatch}${nextPreReleaseNumber.padStart(3, '0')}`;
} else {
  const newPatch = Number(patch) + 1;
  nextVersion = `${major}.${minor}.${newPatch}`;
  androidVersionCode = `${major}${paddedMinor}${newPatch.toString().padStart(2, '0')}`;
}

setWorkspaceVersions(nextVersion, androidVersionCode);
