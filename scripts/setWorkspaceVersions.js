const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const stripIndents = require('common-tags/lib/stripIndents');
const { glob } = require('glob');
const beautify = require('js-beautify').html;
const Xcode = require('pbxproj-dom/xcode').Xcode;
const plist = require('plist');
const RNVersion = require('react-native-version');

module.exports = function setWorkspaceVersions(version, androidVersionCode) {
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

  packages.forEach(({ pgk, version, file }) => {
    pgk.version = version;
    fs.writeFileSync(file, JSON.stringify(pgk, null, 2) + '\n');
  });

  execSync(
    `yarn react-native-version -A -r --generate-build --skip-tag packages/app --set-build ${androidVersionCode}`,
  );

  let bundleVersion = 1;
  const increment = parseInt(version.split('-')[1]?.split('.')[1], 10);
  if (!isNaN(increment) && increment >= 0) {
    //-beta.0 -> 1, -beta.1 -> 2, etc.
    bundleVersion = increment + 1;
  }

  const xcode = Xcode.open(
    './packages/app/ios/azzapp.xcodeproj/project.pbxproj',
  );
  RNVersion.getPlistFilenames(xcode).forEach(name => {
    const file = path.join('./packages/app/ios', name);

    const json = plist.parse(fs.readFileSync(file, 'utf8'));
    const newContent = plist.build(
      Object.assign({}, json, { CFBundleVersion: `${bundleVersion}` }),
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

  console.log(`Updated packages to version ${version}`);
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
