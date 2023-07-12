const { execSync } = require('child_process');
const fs = require('fs');
const { glob } = require('glob');

module.exports = function setWorkspaceVersions(version) {
  if (!version || !version.match(/^\d+\.\d+\.\d+(-[a-z]+\.\d+)?$/)) {
    console.error('Please provide a valid version number');
    process.exit(1);
  }

  const workspacePackageJsonFiles = [
    'package.json',
    ...glob.sync('packages/*/package.json'),
  ];

  const packages = workspacePackageJsonFiles.map(packageJsonFile => {
    const packageJson = require(`../${packageJsonFile}`);
    return { pgk: packageJson, version, file: packageJsonFile };
  });

  const packagesNames = packages.map(p => p.pgk.name);

  const updateDependencies = dependencies => {
    return packagesNames.reduce((acc, name) => {
      if (dependencies[name]) {
        return { ...acc, [name]: version };
      }
      return acc;
    }, dependencies);
  };

  packages.forEach(({ pgk, version, file }) => {
    pgk.version = version;
    if (pgk.dependencies !== undefined) {
      pgk.dependencies = updateDependencies(pgk.dependencies);
    }
    if (pgk.devDependencies !== undefined) {
      pgk.devDependencies = updateDependencies(pgk.devDependencies);
    }
    if (pgk.peerDependencies !== undefined) {
      pgk.peerDependencies = updateDependencies(pgk.peerDependencies);
    }
    if (pgk.optionalDependencies !== undefined) {
      pgk.optionalDependencies = updateDependencies(pgk.optionalDependencies);
    }
    fs.writeFileSync(file, JSON.stringify(pgk, null, 2) + '\n');
  });

  execSync(
    `yarn react-native-version -A -r --generate-build --skip-tag packages/app`,
  );

  console.log(`Updated packages to version ${version}`);
};
