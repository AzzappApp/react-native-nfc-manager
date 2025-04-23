const fs = require('fs');
const path = require('path');
const {
  kind,
  version: internalVersion,
} = require('../../../internal-version.json');
const [major, minor, patch] = require('../package.json')
  .version.split('-')[0]
  .split('.')
  .map(Number);

const paddedMinor = `${minor}`.padStart(2, '0');
const paddedPatch = `${patch}`.padStart(2, '0');
const paddedPreReleaseNumber = `${internalVersion}`.padStart(
  kind === 'rc' || kind === 'canary' ? 3 : 1,
  '0',
);
const androidVersionCode = `${major}${paddedMinor}${paddedPatch}${paddedPreReleaseNumber}`;

const buildGradlePath = path.join(
  __dirname,
  '..',
  'packages',
  'app',
  'android',
  'app',
  'build.gradle',
);
const buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
const updatedBuildGradleContent = buildGradleContent
  .replace(/versionCode\s+\d+/, `versionCode ${androidVersionCode}`)
  .replace(/versionName\s+"[^"]+"/, `versionName "${major}.${minor}.${patch}"`);
fs.writeFileSync(buildGradlePath, updatedBuildGradleContent, 'utf8');
