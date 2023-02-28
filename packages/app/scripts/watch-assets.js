const fs = require('fs');
const path = require('path');
const watchman = require('fb-watchman');
const { SRC_PATH, LIB_PATH } = require('./constants');

const client = new watchman.Client();

client.capabilityCheck({ optional: [], required: ['relative_root'] }, error => {
  if (error) {
    console.error('Error connecting to watchman');
    console.error(error);
    client.end();
    return;
  }

  client.command(['watch-project', SRC_PATH], (error, resp) => {
    if (error) {
      console.log('Error initiating watch:', error);
      client.end();
      return;
    }
    const watch = resp.watch;
    const relativePath = resp.relative_path;

    client.command(['clock', watch], (error, resp) => {
      if (error) {
        console.error(error);
        client.end();
        return;
      }

      client.command(
        [
          'subscribe',
          watch,
          'my-subscription',
          {
            expression: [
              'allof',
              ['type', 'f'],
              [
                'not',
                [
                  'anyof',
                  ['suffix', 'ts'],
                  ['suffix', 'tsx'],
                  ['suffix', 'js'],
                  ['suffix', 'jsx'],
                  ['suffix', 'json'],
                ],
              ],
            ],
            fields: ['name', 'exists'],
            since: resp.clock,
            relative_root: relativePath,
          },
        ],
        error => {
          if (error) {
            console.error('Subscription failed : ', error);
            client.end();
            return;
          }
          console.log('Watchman subscription established');

          // Gestion des événements de changement
          client.on('subscription', resp => {
            if (resp.subscription !== 'my-subscription') {
              return;
            }
            resp.files.forEach(file => {
              const filePath = path.join(SRC_PATH, file.name);
              const destFilePath = path.join(LIB_PATH, file.name);

              if (file.exists) {
                const dir = path.dirname(destFilePath);
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir, { recursive: true });
                }
                fs.copyFile(filePath, destFilePath, error => {
                  if (error) {
                    console.error(error);
                    return;
                  }
                });
              } else if (fs.existsSync(destFilePath)) {
                fs.unlink(destFilePath, error => {
                  if (error) {
                    console.error(error);
                    return;
                  }
                });
              }
            });
          });
        },
      );
    });
  });
});

process.on('beforeExit', () => {
  client.end();
});
