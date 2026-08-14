'use strict';

const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('open-file-dialog'),
  readDroppedFile: (filePath) => ipcRenderer.invoke('read-dropped-file', filePath),
  getDroppedFilePath: (file) => webUtils.getPathForFile(file),
  saveFileDialog: (defaultPath) => ipcRenderer.invoke('save-file-dialog', defaultPath),
  saveFile: (filePath, text) => ipcRenderer.invoke('save-file', filePath, text),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  onFileCommand: (callback) => ipcRenderer.on('main_file_message', (_event, command) => callback(command))
});
