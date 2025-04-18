const fs = require('fs');
const { glob } = require('glob');

module.exports = function setWorkspaceVersions(
  kind,
  major,
  minor,
  patch,
  internal,
) {
  if (kind !== 'canary' && kind !== 'rc' && kind !== 'release') {
    console.error(
      'Please provide a valid pre-release kind: canary, rc or release',
    );
    process.exit(1);
  }
  if (
    typeof major !== 'number' ||
    major < 0 ||
    typeof minor !== 'number' ||
    minor < 0 ||
    typeof patch !== 'number' ||
    patch < 0 ||
    typeof internal !== 'number' ||
    internal <= 0
  ) {
    console.error('Please provide valid version numbers');
    process.exit(1);
  }
  if (internal > (kind === 'release' ? 9 : 999)) {
    console.error(
      'internal version number must be less than 10 for release and 1000 for canary/rc',
    );
    process.exit(1);
  }

  const workspacePackageJsonFiles = [
    'package.json',
    ...glob.sync('packages/*/package.json'),
  ];

  const version = `${major}.${minor}.${patch}`;
  const packages = workspacePackageJsonFiles.map(packageJsonFile => {
    const packageJson = require(`../${packageJsonFile}`);
    return { pgk: packageJson, file: packageJsonFile };
  });
  packages.forEach(({ pgk, file }) => {
    pgk.version = version;
    fs.writeFileSync(file, JSON.stringify(pgk, null, 2) + '\n');
  });

  const internalVersionFile = require.resolve('../internal-version.json');
  fs.writeFileSync(
    internalVersionFile,
    JSON.stringify(
      {
        kind,
        version: internal,
      },
      null,
      2,
    ),
  );

  console.log(`Updated packages to version ${version} (${kind}.${internal})`);
};
