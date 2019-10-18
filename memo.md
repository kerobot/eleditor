# Electoron で テキストエディタを作ってみた

## はじめに

クロスプラットフォームで動作するアプリケーションの開発と、JavaScript、HTML、CSSなどのフロントエンド技術を学習するために、Electron を利用してテキストエディタを作ってみました。
JavaScript(ES6) と Electron のそれぞれの特徴を掴むのが難航しましたが、なんとか形になりました。

## 開発に利用した環境

* Windows 10 x64 Pro 1903
* Visual Studio Code 1.39.2
* Git for Windows 2.23.0.windows.1
* Node 12.8.0 (nodist 0.8.8)

## 参考にさせて頂いた情報

* [すべての新米フロントエンドエンジニアに読んでほしい50の資料](https://qiita.com/suzu-4/items/ea5d802cb0ad16682ae2)
* [JavaScript Primer](https://jsprimer.net/)
* [JavaScript Promiseの本](https://azu.github.io/promises-book/)
* [ELECTRON](https://electronjs.org/)
* [テキストエディターを作ってElectronの基礎を学ぼう！](https://ics.media/entry/8401/)
* [Electronデスクトップアプリ開発入門](https://www.buildinsider.net/enterprise/electron)
* [electron-docs-gitbook](http://imfly.github.io/electron-docs-gitbook/jp/index.html)

## テキストエディタ作成の流れ

### 1. ファイルを用意する

プロジェクトのディレクトリを作成します。

```powershell
> mkdir eleditor
> cd .\eleditor\
```

git を初期化します。

```powershell
> git init
```

> 参考：[Windows 10 と Powershell（WSL含む） で git を利用する](https://qiita.com/kerobot/items/78372640127771f92ee0)

npm で electron をインストールします。

```powershell
> npm install electron
```

> 参考：[ElectronとWebAssemblyとBlazorの違い](https://qiita.com/kerobot/items/27b3ee35a0a6e63ce63c)

いくつかのファイルを先に作っておきます。

```powershell
> # .gitignore
> new-item .gitignore
> echo "node_modules" >> .\.gitignore
> # README.md
> new-item README.md
> echo "# Electron Editor" >> .\README.md
```

アプリケーションのソースを格納するディレクトリを作成します。

```powershell
> mkdir src
```

Visual Studio Code をカレントディレクトリで起動します。

```powershell
> code .
```

プロジェクトの package.json を作成します。

```javascript
{
  "scripts": {
    "start": "electron ./src"
  },
  "devDependencies": {
    "electron": "^6.0.11"
  },
  "private": true
}
```

src ディレクトリ配下にプリケーションの package.json を作成します。

```javascript
{
  "name": "eleditor",
  "version": "0.0.1",
  "description": "Electron Editor.",
  "main": "main.js",
  "author": "hogehoge",
  "license": "ISC"
}
```

src ディレクトリ配下に下記ファイルを作成します。

```powershell
> New-item src/main.js
> New-item src/main.css
> New-item src/index.html
> New-item src/editor.js
```

> これらのファイルはすべて UTF-8 の LF としています。

ここまでのディレクトリとファイルの構造は以下となります。

```text
eledotor
├ node_modules
├ src
│ ├ editor.js
│ ├ index.html
│ ├ main.css
│ ├ main.js
│ └ package.json -> Electron 実行時の設定ファイル
├ .gitignore
├ package.json   -> Electron のビルドコマンドを通すための設定ファイル
└ README.md
```

### 2. プログラムを書く

index.html

> 画面の構成を HTML で記述します。  
> テキストエディタの入力部分として、Ace という JS ライブラリを使用しています。  
> [Ace (HIGH PERFORMANCE CODE EDITOR FOR THE WEB)](https://ace.c9.io/)

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8"/>
  <title>Electron Editor</title>
  <!-- bootstrap -->
  <link rel="stylesheet"
        href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css"
        integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm"
        crossorigin="anonymous">
  <!-- stylesheet -->
  <link href="main.css" rel="stylesheet"/>
  <!-- ace.js -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.6/ace.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.6/mode-javascript.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.6/snippets/javascript.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.6/theme-monokai.js"></script>
  <!-- editor.js -->
  <script src="editor.js"></script>
</head>
<body>
  <div id="input_area"><div id="input_txt"/></div>
  <div id="footer_fixed"/>
</body>
</html>
```

main.css

> 画面のデザインをスタイルシートで記述します。

``` css
* {
  margin: 0px;
  padding: 0px;
}

html,
body {
  width: 100%;
  height: 100%;
  background-color: #1e1e1e;
  overflow: hidden;
}

/* フッターのために20pxを確保 */
#input_area {
  padding: 0px 0px 20px 0px;
  height: 100%;
}

#input_txt {
  width: 100%;
  height: 100%;
}

#footer_fixed {
  position: fixed;
  height: 20px;
  width: 100%;
  bottom: 0px;
  background-color: #337ab7;
  color: #eeeeee;
}
```

main.js

> Electron のエントリーポイントとなる JavaScript ファイルです。  
> アプリケーションのメインウィンドウの作成などを行っています。

```javascript
'use strict';

// アプリケーションのモジュール読み込み
const { app, BrowserWindow, Menu, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const url = require('url');

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
      nodeIntegration: true
    }
  });

  // メインウィンドウに HTML を表示
  mainWindow.loadURL(url.format({
    pathname: path.join(app.getAppPath(), 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

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
```

editor.js

> テキストエディタの処理を JavaScript で記述します。  
> テキストエディタそのものの処理は Ace.js 任せとなるので、メニューをクリックした際の処理やファイル関連の処理が中心となります。

```javascript
'use strict';

// アプリケーションのモジュール読み込み
const {BrowserWindow, dialog} = require('electron').remote;
const {ipcRenderer} = require('electron');
const fs = require('fs');

let inputArea = null;
let inputTxt = null;
let footerArea = null;
let editor = null;
let currentPath = '';

window.addEventListener('DOMContentLoaded', onLoad);

// Webページ読み込み時の処理
function onLoad() {
  // 入力関連領域
  inputArea = document.getElementById('input_area');
  // 入力領域
  inputTxt = document.getElementById('input_txt');
  // フッター領域
  footerArea = document.getElementById('footer_fixed');
  // エディタ関連
  editor = ace.edit('input_txt');
  editor.$blockScrolling = Infinity;
  editor.setTheme('ace/theme/twilight');
  editor.getSession().setMode('ace/mode/javascript');

  // ドラッグ&ドロップ関連
  // イベントの伝搬を止めて、アプリケーションのHTMLとファイルが差し替わらないようにする
  document.addEventListener('dragover', (event) => {
    event.preventDefault();
  });
  document.addEventListener('drop', (event) => {
    event.preventDefault();
  });

  // 入力部分の処理
  inputArea.addEventListener('dragover', (event) => {
    event.preventDefault();
  });
  inputArea.addEventListener('dragleave', (event) => {
    event.preventDefault();
  });
  inputArea.addEventListener('dragend', (event) => {
    event.preventDefault();
  });
  inputArea.addEventListener('drop', (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    readFile(file.path);
  });

  // IPCでメッセージを受信してファイルの制御を行う
  ipcRenderer.on('main_file_message', (event, arg) => {
    console.log(arg);
    if(arg) {
      switch(arg) {
        case 'open':
          // ファイルを開く
          loadFile();
          break;
        case 'save':
          // ファイルを保存
          saveFile();
          break;
        case 'saveas':
          // 名前を付けてファイルを保存
          saveNewFile();
          break;
      }
    }
  });
}

// ファイルの読み込み
function loadFile() {
  const win = BrowserWindow.getFocusedWindow();
  // ファイルを開くダイアログ
  dialog.showOpenDialog( win, {
      properties: ['openFile'],
      title: 'ファイルを開く',
      defaultPath: currentPath,
      multiSelections: false,
      filters: [{name: 'Documents', extensions: ['txt', 'text', 'html', 'js']}]
    }).then(result => {
      // ファイルを開く
      if(!result.canceled && result.filePaths && result.filePaths.hasOwnProperty(0)) {
        readFile(result.filePaths[0]);
      }
    });
}

// テキストを読み込み、テキストを入力エリアに設定
function readFile(path) {
  fs.readFile(path, (error, text) => {
    if (error !== null) {
      alert('error : ' + error);
      return;
    }
    // ファイルパスを保存
    currentPath = path;
    // フッター部分に読み込み先のパスを設定
    footerArea.innerHTML = path;
    // テキスト入力エリアに設定
    editor.setValue(text.toString(), -1);
  });
}

// ファイルの保存
function saveFile() {
  //　初期の入力エリアに設定されたテキストを保存しようとしたときは新規ファイルを作成
  if (currentPath === '') {
    saveNewFile();
    return;
  }
  const win = BrowserWindow.getFocusedWindow();
  // ファイルの上書き保存を確認
  dialog.showMessageBox(win, {
    title: 'ファイル保存',
    type: 'info',
    buttons: ['OK', 'Cancel'],
    message: 'ファイルを上書き保存します。よろしいですか？'
  }).then(result => {
    // OKボタンがクリックされた場合
    if(result.response === 0) {
      const data = editor.getValue();
      writeFile(currentPath, data);
    }
  });
}

// 新規ファイルを保存
function saveNewFile() {
  const win = BrowserWindow.getFocusedWindow();
  // ファイルを保存するダイアログ
  dialog.showSaveDialog( win, {
    properties: ['saveFile'],
    title: '名前を付けて保存',
    defaultPath: currentPath,
    multiSelections: false,
    filters: [{name: 'Documents', extensions: ['txt', 'text', 'html', 'js']}]
  }).then(result => {
    // ファイルを保存してファイルパスを記憶する
    if(!result.canceled && result.filePath) {
      currentPath = result.filePath;
      const data = editor.getValue();
      writeFile(currentPath, data);
    }
  });
}

// テキストをファイルとして保存
function writeFile(path, data) {
  fs.writeFile(path, data, (error) => {
    if (error !== null) {
      alert('error : ' + error);
    }
  });
}
```

### 3. デバッグを行う

.vscode 配下に launch.json を作成します。

```javascript
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug Main Process",
            "type": "node",
            "request": "launch",
            "env": {"NODE_ENV": "development"},
            "cwd": "${workspaceRoot}",
            "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
            "protocol": "inspector",
            "args" : ["src"]
        }
    ]
}
```

Visual Studio Code でデバッグ実行することで"メインプロセス"のデバッグが行えます。

"レンダラープロセス"に関しては、Chromeデベロッパーツールを利用してデバッグを行います。

そのため、Chromeデベロッパーツールを自由に起動できるように main.js で下記のようにショートカットキー（Ctrl + Shift + I）を登録しています。

```javascript
// DOMインスペクタ起動用のショートカットキーを登録
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
```

最後に、GitHub にリポジトリを作成して登録します。

```powershell
> git status
> git add .
> git commit -m "first commit."
> git remote add origin https://github.com/********/********.git
> git push -u origin master
```

## Electron について

Electronは、Node.js がアプリケーションのロジックを担当し、Chromium（ブラウザ）がアプリケーションのUIを担当します。

エントリーポイントとなるメインプロセスがウィンドウ全体を制御し、レンダラープロセスがブラウザを制御します。

今回のテキストエディタでは、メインプロセスでウィンドウの生成やメニューの制御などを行っていますが、メインプロセスでは Node.js のすべての機能を利用することができます。

メインプロセスとレンダラープロセスはそれぞれ独立しているため、プロセス間で制御を行いたい場合は、IPCと呼ばれる通信を利用します。

メインプロセスでメニューを制御し、メニューがクリックされた後の処理をレンダラープロセスで行うため、以下のようにメインプロセスからレンダラープロセスへIPCで指示を行っています。

```javascript
```

## おわりに

