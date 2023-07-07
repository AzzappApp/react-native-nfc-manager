const preReleaseKind = process.argv[2];

if (preReleaseKind && !preReleaseKind.match(/^[a-z]+$/)) {
  console.error('Please provide a valid pre-release kind');
  process.exit(1);
}

const version = require('../package.json').version;
const [, currentPreReleaseKind, preReleaseNumber] =
  version.match(/-([a-z]+)\.(\d)+$/) ?? [];
const [major, minor, patch] = version.split('-')[0].split('.');

if (preReleaseKind && currentPreReleaseKind === preReleaseKind) {
  console.log(
    `${major}.${minor}.${patch}-${preReleaseKind}.${
      Number(preReleaseNumber) + 1
    }`,
  );
} else if (preReleaseKind) {
  console.log(`${major}.${minor}.${Number(patch) + 1}-${preReleaseKind}.0`);
} else {
  console.log(`${major}.${minor}.${Number(patch) + 1}`);
}
