const fs = require('fs');
const path = require('path');
const buildChangeLog = require('./buildChangeLog');

const main = async () => {
  const { changeLog } = await buildChangeLog(
    true,
    false,
    false,
    require('../package.json').version,
  );
  fs.writeFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), changeLog);
};

main();
