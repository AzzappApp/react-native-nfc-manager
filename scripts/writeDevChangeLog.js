const fs = require('fs');
const path = require('path');
const internal = require('../internal-version.json');
const pkg = require('../package.json');
const buildChangeLog = require('./buildChangeLog');

const changeLogPath = path.join(__dirname, '..', 'CHANGELOG.md');

const main = async () => {
  const { changeLog } = await buildChangeLog(
    true,
    false,
    false,
    `${pkg.version}-${internal.kind}.${internal.version}`,
    'chore(ci):',
  );
  const oldData = fs.readFileSync(changeLogPath).toString();
  const newData = oldData ? changeLog + '\n\n' + oldData : changeLog;
  fs.writeFileSync(changeLogPath, newData);
};

main();
