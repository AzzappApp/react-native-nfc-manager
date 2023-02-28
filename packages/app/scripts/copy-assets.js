const fs = require('fs');
const path = require('path');
const { SRC_PATH, LIB_PATH } = require('./constants');

const copyAssets = (dir, dest) => {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest);
  }
  fs.readdirSync(dir).forEach(file => {
    if (
      !file.endsWith('.ts') &&
      !file.endsWith('.js') &&
      !file.endsWith('.tsx') &&
      !file.endsWith('.jsx')
    ) {
      const src = path.join(dir, file);
      const target = path.join(dest, file);
      if (fs.lstatSync(src).isDirectory()) {
        copyAssets(src, target);
      } else {
        fs.copyFileSync(src, target);
      }
    }
  });
};

copyAssets(SRC_PATH, LIB_PATH);
