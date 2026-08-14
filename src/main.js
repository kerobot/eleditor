'use strict';

// アプリケーションのモジュール読み込み
const { app, BrowserWindow, Menu, dialog, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

// メインウィンドウ
let mainWindow;

// メインウィンドウの作成
function createWindow() {
  // メニューを作成
  const menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(menu);

  // メインウィンドウを作成
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // メインウィンドウに HTML を表示
  mainWindow.loadFile(path.join(app.getAppPath(), 'index.html'));

  // メインウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Chromeデベロッパーツール起動用のショートカットキーを登録
  if (process.env.NODE_ENV==='development') {
    app.on('browser-window-focus', (event, focusedWindow) => {
      globalShortcut.register(
        process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        () => focusedWindow.webContents.toggleDevTools()
      )
    })
    app.on('browser-window-blur', (event, focusedWindow) => {
      globalShortcut.unregister(
        process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I'
      )
    })
  }
}

// 初期化が完了した時の処理
app.on('ready', createWindow);

// 全てのウィンドウが閉じたときの処理
app.on('window-all-closed', () => {
  // macOSのとき以外はアプリを終了
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// アプリケーションがアクティブになった時の処理
app.on('activate', () => {
  // メインウィンドウが消えている場合は再度メインウィンドウを作成
  if (mainWindow === null) {
    createWindow();
  }
});

// メニューテンプレートの作成
function createMenuTemplate() {
  // メニューのテンプレート
  let template = [{
    label: 'ファイル',
    submenu: [{
      label: '開く',
      accelerator: 'CmdOrCtrl+O',
      click: function(item, focusedWindow) {
        if (focusedWindow) {
          // レンダラープロセスへIPCでメッセージを送信してファイルを開く
          focusedWindow.webContents.send('main_file_message', 'open');
        }
      }
    }, {
      label: '保存',
      accelerator: 'CmdOrCtrl+S',
      click: function(item, focusedWindow) {
        if (focusedWindow) {
          // レンダラープロセスへIPCでメッセージを送信してファイルを保存
          focusedWindow.webContents.send('main_file_message', 'save');
        }
      }
    }, {
      label: '名前を付けて保存',
      accelerator: 'Shift+CmdOrCtrl+S',
      click: function(item, focusedWindow) {
        if (focusedWindow) {
          // レンダラープロセスへIPCでメッセージを送信してファイルを名前を付けて保存
          focusedWindow.webContents.send('main_file_message', 'saveas');
        }
      }
    }]
  }, {
    label: '編集',
    submenu: [{
      label: 'やり直し',
      accelerator: 'CmdOrCtrl+Z',
      role: 'undo'
    }, {
      type: 'separator'
    }, {
      label: '切り取り',
      accelerator: 'CmdOrCtrl+X',
      role: 'cut'
    }, {
      label: 'コピー',
      accelerator: 'CmdOrCtrl+C',
      role: 'copy'
    }, {
      label: '貼り付け',
      accelerator: 'CmdOrCtrl+V',
      role: 'paste'
    }]
  }, {
    label: '表示',
    submenu: [{
      label: '全画面表示切替',
      accelerator: (function() {
        if (process.platform === 'darwin') {
          return 'Ctrl+Command+F'
        } else {
          return 'F11'
        }
      })(),
      click: function(item, focusedWindow) {
        if (focusedWindow) {
          // 全画面表示の切り替え
          focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
        }
      }
    }, {
      label: '拡大',
      accelerator: 'CmdOrCtrl+Shift+=',
      role: 'zoomin'
    }, {
      label: '縮小',
      accelerator: 'CmdOrCtrl+-',
      role: 'zoomout'
    }, {
      label: 'ズームのリセット',
      accelerator: 'CmdOrCtrl+0',
      role: 'resetzoom'
    }]
  }]
  return template;
}

ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    title: 'ファイルを開く',
    filters: [{ name: 'Documents', extensions: ['txt', 'text', 'html', 'js'] }]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  const filePath = result.filePaths[0];
  return { filePath, text: await fs.promises.readFile(filePath, 'utf8') };
});

ipcMain.handle('read-dropped-file', async (_event, filePath) => ({
  filePath,
  text: await fs.promises.readFile(filePath, 'utf8')
}));

ipcMain.handle('save-file-dialog', async (_event, defaultPath) => {
  const result = await dialog.showSaveDialog({
    title: '名前を付けて保存',
    defaultPath,
    filters: [{ name: 'Documents', extensions: ['txt', 'text', 'html', 'js'] }]
  });
  return result.canceled ? null : result.filePath;
});

ipcMain.handle('save-file', (_event, filePath, text) => fs.promises.writeFile(filePath, text, 'utf8'));

ipcMain.handle('show-message-box', (_event, options) => dialog.showMessageBox(options));