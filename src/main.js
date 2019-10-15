'use strict';

// アプリケーション作成用のモジュールを読み込み
const { app, BrowserWindow } = require('electron');

const path = require('path');
const url = require('url');

// メインウィンドウ
let mainWindow;

function createWindow() {
  // メインウィンドウを作成
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // メインウィンドウに表示するURL(index.html)
  mainWindow.loadURL(url.format({
    pathname: path.join(app.getAppPath(), 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // デベロッパーツールの起動
  // mainWindow.webContents.openDevTools();

  // メインウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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

// アプリケーションがアクティブになった時の処理(MacはDockがクリックされた時）
app.on('activate', () => {
  // メインウィンドウが消えている場合は再度メインウィンドウを作成
  if (mainWindow === null) {
    createWindow();
  }
});
