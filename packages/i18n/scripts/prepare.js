const fs = require('fs');
const path = require('path');
const { SUPPORTED_LOCALES } = require('../index');

const DEV_LANG = 'dev-lang.json';

const prepare = (keysFile, target) => {
  const keys = JSON.parse(fs.readFileSync(keysFile, 'utf8'));
  const supportedLanguagesMap = {};
  fs.readdirSync(target).forEach(file => {
    if (!file.endsWith('.json')) {
      return;
    }
    if (file === DEV_LANG) {
      fs.unlinkSync(`${target}/${file}`);
      return;
    }
    const lang = file.split('.')[0];
    supportedLanguagesMap[lang] = true;
    const fileContent = fs.readFileSync(`${target}/${file}`, 'utf8');
    const fileJSON = JSON.parse(fileContent);
    Object.entries(keys).forEach(([key, { defaultMessage }]) => {
      if (!fileJSON[key]) {
        fileJSON[key] = defaultMessage;
      }
    }, {});
    fs.writeFileSync(`${target}/${file}`, JSON.stringify(fileJSON, null, 2));
  });
  SUPPORTED_LOCALES.forEach(lang => {
    if (supportedLanguagesMap[lang]) {
      return;
    }
    const fileJSON = {};
    Object.entries(keys).forEach(([key, { defaultMessage }]) => {
      fileJSON[key] = defaultMessage;
    }, {});
    fs.writeFileSync(
      `${target}/${lang}.json`,
      JSON.stringify(fileJSON, null, 2),
    );
  });
};

prepare(
  path.join(__dirname, '..', 'src/appMessages.json'),
  path.join(__dirname, '..', 'src/app'),
);

prepare(
  path.join(__dirname, '..', 'src/webMessages.json'),
  path.join(__dirname, '..', 'src/web'),
);
