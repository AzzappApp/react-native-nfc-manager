const { execSync } = require('child_process');
const path = require('path');
const { kind, version: internalVersion } = require('../internal-version.json');
const pkg = require('../package.json');
const [major, minor, patch] = require('../package.json')
  .version.split('-')[0]
  .split('.')
  .map(Number);

let androidVersionCode = 0;
const paddedMinor = `${minor}`.padStart(2, '0');
const paddedPatch = `${patch}`.padStart(2, '0');
const paddedPreReleaseNumber = `${internalVersion}`.padStart(
  kind === 'rc' || kind === 'canary' ? 3 : 1,
  '0',
);
androidVersionCode = `${major}${paddedMinor}${paddedPatch}${paddedPreReleaseNumber}`;

execSync(
  `./tools/androidmanifest-changer --versionCode ${androidVersionCode} --versionName ${pkg.version} azzapp.aab`,
  { stdio: 'inherit', cwd: path.join(__dirname, '..') },
);
