const internal = require('../internal-version.json');
const pkg = require('../package.json');
const setWorkspaceVersions = require('./setWorkspaceVersions');

const versionKind = process.argv[2];

if (
  !versionKind ||
  (versionKind !== 'canary' &&
    versionKind !== 'rc' &&
    versionKind !== 'release')
) {
  console.error('Please provide a valid pre-release kind');
  process.exit(1);
}

// eslint-disable-next-line prefer-const
let [major, minor, patch] = pkg.version.split('-')[0].split('.').map(Number);
let internalVersion = Number(internal.version);
const precedence = {
  canary: 0,
  rc: 1,
  release: 2,
};

const maxInternalVersion = versionKind === 'release' ? 9 : 999;
if (versionKind === internal.kind) {
  internalVersion += 1;
  if (internalVersion > maxInternalVersion) {
    internalVersion = 1;
    patch += 1;
  }
} else if (precedence[versionKind] < precedence[internal.kind]) {
  minor += 1;
  patch = 0;
  internalVersion = 1;
} else {
  internalVersion = 1;
}

setWorkspaceVersions(versionKind, major, minor, patch, internalVersion);
