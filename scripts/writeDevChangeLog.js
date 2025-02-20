const fs = require('fs');
const path = require('path');
const buildChangeLog = require('./buildChangeLog');

const changeLogPath = path.join(__dirname, '..', 'CHANGELOG.md');

const main = async () => {
  const { changeLog } = await buildChangeLog(
    true,
    false,
    false,
    require('../package.json').version,
    'chore(ci):',
  );
  const oldData = fs.readFileSync(changeLogPath).toString();
  const newData = oldData ? changeLog + '\n\n' + oldData : changeLog;
  fs.writeFileSync(changeLogPath, newData);
};

main();
