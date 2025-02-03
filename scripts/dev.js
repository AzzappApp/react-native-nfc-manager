const path = require('path');
const Blessed = require('blessed');
const BlessedXTerm = require('blessed-xterm');
const glob = require('fast-glob');

const ROOT_DIR = path.join(__dirname, '..');
const MENU_SIZE = 30;
const HELP_WIDTH = 30;
const HELP_HEIGHT = 8;

let screen;
let sideBar;
const terminals = {};

const menuItems = [];

let displayedScreenID = null;

const init = () => {
  require('events').EventEmitter.defaultMaxListeners = 15;

  const scripts = getScripts();
  setupScreen();
  scripts.forEach(({ name, cwd, scripts }) => {
    scripts.forEach(script => {
      setupTerminal(`${name}:${script}`, `yarn ${script}`, cwd);
    });
  });

  scripts.forEach(({ name, scripts }) => {
    menuItems.push({ id: name, label: name, selectable: false });
    scripts.forEach(script => {
      menuItems.push({
        id: `${name}:${script}`,
        label: ` - ${script}`,
        selectable: true,
      });
    });
  });
  setupSidebar();

  process.on('exit', terminate);

  const firstScreenId = `${scripts[0].name}:${scripts[0].scripts[0]}`;
  sideBar.select(menuItems.findIndex(item => item.id === firstScreenId));
  showTerminal(firstScreenId);
  sideBar.focus();

  showHelp();
  screen.render();
};

const showHelp = () => {
  const helpBox = new Blessed.Box({
    left: Math.floor((screen.width - HELP_WIDTH) / 2),
    top: Math.floor((screen.height - HELP_HEIGHT) / 2),
    width: HELP_WIDTH,
    height: HELP_HEIGHT,
    padding: 1,
    tags: true,
    border: 'line',
    content: 'ctrl-q: quit\n↑/↓: navigate\nEnter: select\nescape: unfocus',
    hidden: false,
    style: {
      fg: 'default',
      bg: 'default',
      border: { fg: 'default' },
    },
  });

  screen.append(helpBox);

  const timeout = setTimeout(() => {
    destroyHelp();
  }, 5000);

  const destroyHelp = () => {
    helpBox.destroy();
    screen.render();
    clearTimeout(timeout);
    screen.off('keypress', destroyHelp);
  };

  screen.on('keypress', destroyHelp);
};

const terminate = () => {
  Object.values(terminals).forEach(term => {
    term.terminate();
  });
  screen.destroy();
};

const getScripts = () => {
  const packages = glob.sync('**/package.json', {
    cwd: ROOT_DIR,
    ignore: ['**/node_modules/**'],
  });
  return packages
    .map(packagePath => {
      const packageDir = path.dirname(packagePath);
      const packageJson = require(path.join(ROOT_DIR, packagePath));
      const scripts = packageJson.devScripts || {};
      return {
        name: packageJson.name,
        cwd: path.join(ROOT_DIR, packageDir),
        scripts,
      };
    })
    .filter(({ scripts }) => !!scripts?.length);
};

const setupScreen = () => {
  screen = Blessed.screen({
    title: 'Azzapp Dev',
    smartCSR: true,
    autoPadding: false,
    warnings: false,
  });
  screen.program.hideCursor();
  screen.enableMouse();
  screen.key(['C-q'], () => {
    terminate();
  });

  screen.on('resize', () => {
    Object.values(terminals).forEach(term => {
      term.width = screen.width - MENU_SIZE;
    });
    screen.render();
  });
};

const scrollUp = terminal => {
  if (!terminal.scrolling) {
    terminal.scroll(0);
  }

  const n = Math.max(1, Math.floor(terminal.height * 0.1));
  terminal.scroll(-n);

  if (Math.ceil(terminal.getScrollPerc()) === 100) {
    terminal.resetScroll();
  }
};

const scrollDown = terminal => {
  if (!terminal.scrolling) {
    terminal.scroll(0);
  }

  const n = Math.max(1, Math.floor(terminal.height * 0.1));
  terminal.scroll(+n);
  if (Math.ceil(terminal.getScrollPerc()) === 100) {
    terminal.resetScroll();
  }
};

const selectCurrentTerminal = () => {
  const term = terminals[displayedScreenID];
  setTimeout(() => {
    term.focus();
    screen.program.disableMouse();
    screen.render();
    term.enableMouse();
  }, 10);
};

const setupTerminal = (id, command, cwd) => {
  const term = new BlessedXTerm({
    left: MENU_SIZE,
    top: 0,
    width: screen.width - MENU_SIZE,
    height: screen.height,
    shell: null,
    args: [],
    env: process.env,
    cwd: process.cwd(),
    cursorBlink: true,
    ignoreKeys: [],
    controlKey: 'none',
    fg: 'normal',
    tags: true,
    border: 'line',
    scrollback: 1000,
    hidden: true,
    style: {
      fg: 'default',
      bg: 'default',
      border: { fg: 'default' },
      focus: { border: { fg: 'green' } },
      scrolling: { border: { fg: 'yellow' } },
    },
  });
  term.enableMouse();

  term.on('click', () => {
    selectCurrentTerminal();
  });

  term.on('mouse', evt => {
    switch (evt.action) {
      case 'wheeldown':
        return scrollDown(term);
      case 'wheelup':
        return scrollUp(term);
    }
  });

  term.key(['escape'], () => {
    sideBar.focus();
    screen.program.enableMouse();
  });

  term.on('beep', () => {
    screen.program.output.write('\x07');
  });

  screen.append(term);
  term.spawn(process.env.SHELL ?? 'sh', [], cwd, process.env);
  term.injectInput(command + '\n');
  terminals[id] = term;
};

const showTerminal = screenId => {
  if (!terminals[screenId] || screenId === displayedScreenID) {
    return;
  }
  if (displayedScreenID) {
    terminals[displayedScreenID].hidden = true;
  }
  terminals[screenId].hidden = false;
  screen.render();
  displayedScreenID = screenId;
};

const setupSidebar = () => {
  sideBar = Blessed.list({
    left: 0,
    top: 0,
    width: MENU_SIZE,
    height: screen.height,
    mouse: true,
    items: menuItems.map(item => item.label),
    padding: 1,
    keys: false,
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      selected: {
        bg: 'blue',
        fg: 'white',
      },
      border: { fg: 'default' },
      focus: { border: { fg: 'green' } },
    },
  });

  sideBar.on('select item', (_, index) => {
    const menuItem = menuItems[index];
    if (!menuItem.selectable) {
      sideBar.select(
        menuItems.findIndex(item => item.id === displayedScreenID),
      );
      return;
    }
    if (sideBar.items[index].fg === 'red') {
      sideBar.items[index].fg = 'default';
    }
    showTerminal(menuItems[index].id);
  });

  sideBar.key(['up'], () => {
    let index = menuItems.findIndex(item => item.id === displayedScreenID);

    while (true) {
      let prevIndex = index - 1;
      if (prevIndex < 0) {
        prevIndex = menuItems.length - 1;
      }
      const prevItem = menuItems[prevIndex];
      if (prevItem.selectable) {
        sideBar.select(prevIndex);
        showTerminal(prevItem.id);
        return;
      }
      index = prevIndex;
    }
  });

  sideBar.key(['down'], () => {
    let index = menuItems.findIndex(item => item.id === displayedScreenID);
    while (true) {
      const nextIndex = (index + 1) % menuItems.length;
      const nextItem = menuItems[nextIndex];
      if (nextItem.selectable) {
        sideBar.select(nextIndex);
        showTerminal(nextItem.id);
        return;
      }
      index = nextIndex;
    }
  });

  sideBar.key(['enter'], () => {
    selectCurrentTerminal();
  });

  screen.append(sideBar);
};

init();
