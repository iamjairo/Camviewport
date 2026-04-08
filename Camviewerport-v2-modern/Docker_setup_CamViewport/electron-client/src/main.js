const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

let mainWindow;

// Default configuration
const defaultConfig = {
  serverUrl: 'http://localhost:8080',
  cameras: [],
  layout: {
    rows: 2,
    cols: 2
  },
  autoReconnect: true,
  lowLatencyMode: true,
  hardwareAcceleration: true
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      enableRemoteModule: false
    },
    backgroundColor: '#000000',
    show: false,
    icon: path.join(__dirname, '../build/icon.png')
  });

  // Enable hardware acceleration for better video performance
  if (store.get('hardwareAcceleration', true)) {
    app.commandLine.appendSwitch('enable-accelerated-video-decode');
    app.commandLine.appendSwitch('enable-gpu-rasterization');
    app.commandLine.appendSwitch('ignore-gpu-blacklist');
  }

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Settings',
          click: () => {
            mainWindow.webContents.send('open-settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          role: 'quit'
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Layout',
      submenu: [
        {
          label: '1x1',
          click: () => mainWindow.webContents.send('set-layout', { rows: 1, cols: 1 })
        },
        {
          label: '2x2',
          click: () => mainWindow.webContents.send('set-layout', { rows: 2, cols: 2 })
        },
        {
          label: '3x3',
          click: () => mainWindow.webContents.send('set-layout', { rows: 3, cols: 3 })
        },
        {
          label: '4x4',
          click: () => mainWindow.webContents.send('set-layout', { rows: 4, cols: 4 })
        },
        { type: 'separator' },
        {
          label: 'Custom...',
          click: () => mainWindow.webContents.send('open-custom-layout')
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            mainWindow.webContents.send('show-about');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('get-config', () => {
  return store.get('config', defaultConfig);
});

ipcMain.handle('save-config', (event, config) => {
  store.set('config', config);
  return { success: true };
});

ipcMain.handle('get-cameras', () => {
  return store.get('config.cameras', []);
});

ipcMain.handle('save-cameras', (event, cameras) => {
  const config = store.get('config', defaultConfig);
  config.cameras = cameras;
  store.set('config', config);
  return { success: true };
});

ipcMain.handle('get-layout', () => {
  return store.get('config.layout', defaultConfig.layout);
});

ipcMain.handle('save-layout', (event, layout) => {
  const config = store.get('config', defaultConfig);
  config.layout = layout;
  store.set('config', config);
  return { success: true };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});