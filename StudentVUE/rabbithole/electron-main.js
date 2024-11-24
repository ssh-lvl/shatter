'use strict';
const {app, BrowserWindow, Menu, shell, screen, dialog} = require('electron');
const path = require('path');
const steamworks = require('steamworks.js');
const http = require('http');
const url = require('url');
const RPC = require('discord-rpc');

const steamClient = steamworks.init();

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

if (isMac) {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: 'appMenu' },
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { role: 'windowMenu' },
    { role: 'help' }
  ]));
} else {
  Menu.setApplicationMenu(null);
}

const resourcesURL = Object.assign(new URL('file://'), {
  pathname: path.join(__dirname, '/')
}).href;
const defaultProjectURL = new URL('./index.html', resourcesURL).href;

const createWindow = (windowOptions) => {
  const options = {
    title: "Rabbit Hole",
    icon: path.resolve(__dirname, "icon.png"),
    useContentSize: true,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: true,
    width: 480,
    height: 360,
    ...windowOptions,
  };

  const activeScreen = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const bounds = activeScreen.workArea;
  options.x = bounds.x + ((bounds.width - options.width) / 2);
  options.y = bounds.y + ((bounds.height - options.height) / 2);

  const window = new BrowserWindow(options);
  return window;
};

const createProjectWindow = (url) => {
  const windowMode = "fullscreen";
  const options = {
    show: false,
    backgroundColor: "#604e61",
    width: 480,
    height: 360,
    minWidth: 50,
    minHeight: 50,
  };
  // fullscreen === false disables fullscreen on macOS so only set this property when it's true
  if (windowMode === 'fullscreen') {
    options.fullscreen = true;
  }
  const window = createWindow(options);
  if (windowMode === 'maximize') {
    window.maximize();
  }
  window.loadURL(url);
  window.show();
  if (app.commandLine.hasSwitch('dev-tools')) {
    window.webContents.openDevTools();
  }
};

const createDataWindow = (dataURI) => {
  const window = createWindow({});
  window.loadURL(dataURI);
};

const isResourceURL = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'file:' && parsedUrl.href.startsWith(resourcesURL);
  } catch (e) {
    // ignore
  }
  return false;
};

const SAFE_PROTOCOLS = [
  'https:',
  'http:',
  'mailto:',
];

const isSafeOpenExternal = (url) => {
  try {
    const parsedUrl = new URL(url);
    return SAFE_PROTOCOLS.includes(parsedUrl.protocol);
  } catch (e) {
    // ignore
  }
  return false;
};

const isDataURL = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'data:';
  } catch (e) {
    // ignore
  }
  return false;
};

const openLink = (url) => {
  if (isDataURL(url)) {
    createDataWindow(url);
  } else if (isResourceURL(url)) {
    createProjectWindow(url);
  } else if (isSafeOpenExternal(url)) {
    shell.openExternal(url);
  }
};

app.on('render-process-gone', (event, webContents, details) => {
  const window = BrowserWindow.fromWebContents(webContents);
  dialog.showMessageBoxSync(window, {
    type: 'error',
    title: 'Error',
    message: 'Renderer process crashed: ' + details.reason + ' (' + details.exitCode + ')'
  });
});

app.on('child-process-gone', (event, details) => {
  dialog.showMessageBoxSync({
    type: 'error',
    title: 'Error',
    message: details.type + ' child process crashed: ' + details.reason + ' (' + details.exitCode + ')'
  });
});

app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler((details) => {
    setImmediate(() => {
      openLink(details.url);
    });
    return {action: 'deny'};
  });
  contents.on('will-navigate', (e, url) => {
    if (!isResourceURL(url)) {
      e.preventDefault();
      openLink(url);
    }
  });
  contents.on('before-input-event', (e, input) => {
    const window = BrowserWindow.fromWebContents(contents);
    if (!window || input.type !== "keyDown") return;
    if (input.key === 'F11' || (input.key === 'Enter' && input.alt)) {
      window.setFullScreen(!window.isFullScreen());
    } else if (input.key === 'Escape') {
      const behavior = "nothing";
      if (window.isFullScreen() && (behavior === 'unfullscreen-only' || behavior === 'unfullscreen-or-exit')) {
        window.setFullScreen(false);
      } else if (behavior === 'unfullscreen-or-exit' || behavior === 'exit-only') {
        window.close();
      }
    }
  });
});

app.on('session-created', (session) => {
  session.webRequest.onBeforeRequest({
    urls: ["file://*"]
  }, (details, callback) => {
    callback({
      cancel: !details.url.startsWith(resourcesURL)
    });
  });
});

app.whenReady().then(() => {
  createProjectWindow(defaultProjectURL);
});

let runStarted = Date.now();
const httpServer = http.createServer((req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === '/steamworks/achv' && req.method === 'GET') {
      const achv = parsedUrl.query.name;

      if (!achv) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing achievement name');
        return;
      }
    
      const achvApiName = achv.split('/')[1];

      if (steamClient.achievement.isActivated(achvApiName)) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Achievement already activated');
        return;
      }

      if (steamClient.achievement.activate(achvApiName)) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Achievement activated');
      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Failed to activate achievement');
      }
    } else if (parsedUrl.pathname === '/rpc/update' && req.method === 'GET') {
      const floorNum = parsedUrl.query.floor;
      const character = parsedUrl.query.chara;

      if (!floorNum || !character) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing params');
        return;
      }

      if (floorNum == 1) {
        runStarted = Date.now();
      }

      rpcClient.setActivity({
        details: `In the Rabbit Hole`,
        state: `Floor ${floorNum}`,
        largeImageKey: `floor_${floorNum}`,
        largeImageText: `Floor ${floorNum}`,
        smallImageKey: `portrait_${character.toLowerCase()}`,
        smallImageText: `Playing as ${character.toUpperCase()}`,
        startTimestamp: runStarted,
      })

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('RPC updated');
    } else if (parsedUrl.pathname === '/rpc/menu' && req.method === 'GET') {
      rpcClient.setActivity({
        details: 'In the menu',
        largeImageKey: 'rabbit-hole',
        largeImageText: 'Rabbit Hole',
        instance: false,
      });

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('RPC updated');
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  } catch (e) {
    // ignore
  }
});

app.on('window-all-closed', () => {
  httpServer.close();
  app.quit();
});

httpServer.listen(21420);

const rpcClient = new RPC.Client({ transport: 'ipc' });

rpcClient.on('ready', () => {
  rpcClient.setActivity({
    details: 'In the menu',
    largeImageKey: 'rabbit-hole',
    largeImageText: 'Rabbit Hole',
    instance: false,
  });
})

rpcClient.login({ clientId: '1240472166068387840' });
steamworks.electronEnableSteamOverlay();
