const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const stripIndents = require('common-tags/lib/stripIndents');
const beautify = require('js-beautify').html;
const Xcode = require('pbxproj-dom/xcode').Xcode;
const plist = require('plist');
const RNVersion = require('react-native-version');

const { kind, version: internalVersion } = require('../internal-version.json');
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
  `yarn react-native-version -A -r --generate-build --skip-tag packages/app --set-build ${androidVersionCode}`,
);

const xcode = Xcode.open('./packages/app/ios/azzapp.xcodeproj/project.pbxproj');
RNVersion.getPlistFilenames(xcode).forEach(name => {
  const file = path.join('./packages/app/ios', name);

  const json = plist.parse(fs.readFileSync(file, 'utf8'));
  const newContent = plist.build(
    Object.assign({}, json, { CFBundleVersion: `${internalVersion}` }),
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

const plistPath = path.join('./packages/app/ios/azzapp', 'Info.plist');
const plistContent = fs.readFileSync(plistPath, 'utf8');
const plistData = plist.parse(plistContent);
const buildVersion = plistData.CFBundleVersion;
const shortVersion = plistData.CFBundleShortVersionString;
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
