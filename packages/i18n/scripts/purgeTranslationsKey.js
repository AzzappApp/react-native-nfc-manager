const mysql = require('mysql2');

const { DATABASE_URL } = process.env;

(async () => {
  const appMessages = require('../src/appMessages.json');
  const webMessages = require('../src/webMessages.json');
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
  });

  const [{ affectedRows: deletedAppMessages }] = await connection
    .promise()
    .query(
      `DELETE FROM LocalizationMessage WHERE target = ? AND LocalizationMessage.key NOT IN(?)`,
      ['app', Object.keys(appMessages)],
    );
  console.log(`Deleted ${deletedAppMessages} app messages`);

  const [{ affectedRows: deletedWebMessages }] = await connection
    .promise()
    .query(
      `DELETE FROM LocalizationMessage WHERE target = ? AND LocalizationMessage.key NOT IN (?)`,
      ['web', Object.keys(webMessages)],
    );
  console.log(`Deleted ${deletedWebMessages} web messages`);
  process.exit(0);
})();
