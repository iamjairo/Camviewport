const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  getCameras: () => ipcRenderer.invoke('get-cameras'),
  saveCameras: (cameras) => ipcRenderer.invoke('save-cameras', cameras),
  getLayout: () => ipcRenderer.invoke('get-layout'),
  saveLayout: (layout) => ipcRenderer.invoke('save-layout', layout),
  
  // Receive messages from main process
  onOpenSettings: (callback) => {
    ipcRenderer.on('open-settings', callback);
  },
  onSetLayout: (callback) => {
    ipcRenderer.on('set-layout', (event, layout) => callback(layout));
  },
  onOpenCustomLayout: (callback) => {
    ipcRenderer.on('open-custom-layout', callback);
  },
  onShowAbout: (callback) => {
    ipcRenderer.on('show-about', callback);
  }
});