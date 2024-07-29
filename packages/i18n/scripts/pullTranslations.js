const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const { SUPPORTED_LOCALES } = require('../index');

const { DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_HOST } = process.env;
const pullTranslations = async (target, dir) => {
  const connection = await mysql.createConnection({
    uri: `mysql://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}/azzapp?ssl={"rejectUnauthorized":true}`,
  });

  const [messages] = await connection
    .promise()
    .query(`SELECT * FROM LocalizationMessage WHERE target = ?`, [target]);

  const table = SUPPORTED_LOCALES.reduce(
    (acc, locale) => ({
      ...acc,
      [locale]: {},
    }),
    {},
  );
  for (const { key, locale, value } of messages) {
    if (!table[locale]) {
      console.warn(`Unsupported locale: ${locale}`);
    }
    table[locale][key] = value;
  }
  for (const locale of SUPPORTED_LOCALES) {
    fs.writeFileSync(
      path.join(dir, `${locale}.json`),
      JSON.stringify(table[locale], null, 2),
    );
  }
};

(async () => {
  await pullTranslations('app', path.resolve(__dirname, '..', 'src', 'app'));
  await pullTranslations('web', path.resolve(__dirname, '..', 'src', 'web'));
  process.exit(0);
})();
