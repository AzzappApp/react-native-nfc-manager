const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const stripIndents = require('common-tags/lib/stripIndents');
const { glob } = require('glob');
const beautify = require('js-beautify').html;
const Xcode = require('pbxproj-dom/xcode').Xcode;
const plist = require('plist');
const RNVersion = require('react-native-version');

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

  let androidVersionCode = 0;
  const paddedMinor = `${minor}`.padStart(2, '0');
  const paddedPatch = `${patch}`.padStart(2, '0');
  const paddedPreReleaseNumber = `${internal}`.padStart(
    kind === 'rc' || kind === 'canary' ? 3 : 1,
    '0',
  );
  androidVersionCode = `${major}${paddedMinor}${paddedPatch}${paddedPreReleaseNumber}`;

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

  execSync(
    `yarn react-native-version -A -r --generate-build --skip-tag packages/app --set-build ${androidVersionCode}`,
  );

  const xcode = Xcode.open(
    './packages/app/ios/azzapp.xcodeproj/project.pbxproj',
  );
  RNVersion.getPlistFilenames(xcode).forEach(name => {
    const file = path.join('./packages/app/ios', name);

    const json = plist.parse(fs.readFileSync(file, 'utf8'));
    const newContent = plist.build(
      Object.assign({}, json, { CFBundleVersion: `${internal}` }),
    );

    fs.writeFileSync(
      file,
      stripIndents`
      <?xml version="1.0" encoding="UTF-8"?>
      <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
      <plist version="1.0">` +
        '\n' +
        beautify(
          newContent.match(/<dict>[\s\S]*<\/dict>/)[0],
          Object.assign({ end_with_newline: true, indent_with_tabs: true }),
        ) +
        stripIndents`
      </plist>` +
        '\n',
    );
  });
  updatePbxProject();

  console.log(`Updated packages to version ${version} (${kind}.${internal})`);
};

const updatePbxProject = () => {
  const plistPath = path.join('./packages/app/ios/azzapp', 'Info.plist');
  const plistContent = fs.readFileSync(plistPath, 'utf8');
  const plistData = plist.parse(plistContent);
  const buildVersion = plistData.CFBundleVersion;
  const shortVersion = plistData.CFBundleShortVersionString;
  const projectPath = path.join(
    './packages/app/ios/azzapp.xcodeproj',
    'project.pbxproj',
  );
  const xcode = Xcode.open(projectPath);
  xcode.document.projects.forEach(project => {
    project.targets.forEach(target => {
      if (target.buildConfigurationsList) {
        target.buildConfigurationsList.buildConfigurations.forEach(config => {
          const buildSettings = config.ast.value.get('buildSettings');
          buildSettings.set('MARKETING_VERSION', shortVersion);
          buildSettings.set('CURRENT_PROJECT_VERSION', buildVersion);
        });
      }
    });
  });

  xcode.save();
};
