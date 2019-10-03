# Electoron で シンプルエディタを作ってみた

プロジェクトのディレクトリの作成

```powershell
> mkdir eleditor
> cd .\eleditor\
```

git の初期化

```powershell
> git init
```

electron のインストール

```powershell
> npm install electron
```

いくつかのファイルを作っておく

```powershell
> # .gitignore
> new-item .gitignore
> echo "node_modules" >> .\.gitignore
> # README.md
> new-item README.md
> echo "# Electron Editor" >> .\README.md
```

ソースを格納するディレクトリの作成

```powershell
> mkdir src
```

Visual Studio Code をカレントディレクトリで起動

```powershell
> code .
```

package.json

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

src/package.json

```javascript
{
  "name": "electroneditor",
  "version": "0.0.1",
  "description": "Electron Editor.",
  "main": "main.js",
  "author": "kerobot",
  "license": "ISC"
}
```

src/main.js

```javascript
'use strict';

// アプリケーション作成用のモジュールを読み込み
const { app, BrowserWindow } = require('electron');

const path = require('path');
const url = require('url');

// メインウィンドウ
let mainWindow;

function createWindow() {
  // メインウィンドウを作成します
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // メインウィンドウに表示するURLを指定します
  // （今回はmain.jsと同じディレクトリのindex.html）
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // デベロッパーツールの起動
  mainWindow.webContents.openDevTools();

  // メインウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

//  初期化が完了した時の処理
app.on('ready', createWindow);

// 全てのウィンドウが閉じたときの処理
app.on('window-all-closed', () => {
  // macOSのとき以外はアプリを終了させます
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// アプリケーションがアクティブになった時の処理(Macだと、Dockがクリックされた時）
app.on('activate', () => {
  /// メインウィンドウが消えている場合は再度メインウィンドウを作成する
  if (mainWindow === null) {
    createWindow();
  }
});
```

src/main.css

```css
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

/** ヘッダーが34px、フッターが20px */
#input_area {
  padding: 34px 0px 20px 0px;
  height: 100%;
}

#input_txt {
  width: 100%;
  height: 100%;
}

#header_fixed {
  position: fixed;
  height: 34px;
  width: 100%;
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

src/index.html

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8"/>
  <title>Electron Editor</title>
  <link rel="stylesheet"
        href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css"
        integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm"
        crossorigin="anonymous">
  <link href="main.css" rel="stylesheet"/>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.6/ace.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.6/mode-javascript.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.6/snippets/javascript.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.6/theme-monokai.js"></script>
  <script src="editor.js"></script>
</head>
<body>
  <div id="header_fixed">
    <button type="button"
            class="btn-sm btn-primary"
            id="btnLoad">
      読み込む
    </button>
    <button type="button"
            class="btn-sm
            btn-primary"
            id="btnSave">
      保存する
    </button>
  </div>
  <div id="footer_fixed"></div>
  <div id="input_area">
    <div id="input_txt"></div>
  </div>
</body>
</html>
```

src/editor.js

```javascript
'use strict';

const fs = require('fs');
const {BrowserWindow, dialog} = require('electron').remote;

let inputArea = null;
let inputTxt = null;
let footerArea = null;

let currentPath = '';
let editor = null;

window.addEventListener('DOMContentLoaded', onLoad);

/**
 * Webページ読み込み時の処理
 */
function onLoad() {
  // 入力関連領域
  inputArea = document.getElementById('input_area');
  // 入力領域
  inputTxt = document.getElementById('input_txt');
  // フッター領域
  footerArea = document.getElementById('footer_fixed');

  editor = ace.edit('input_txt');
  editor.$blockScrolling = Infinity;

  editor.setTheme('ace/theme/twilight');
  editor.getSession().setMode('ace/mode/javascript');

  // ドラッグ&ドロップ関連処理
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

  // 「読み込む」ボタンの制御
  document.querySelector('#btnLoad').addEventListener('click', () => {
    openLoadFile();
  });
  // 「保存する」ボタンの制御
  document.querySelector('#btnSave').addEventListener('click', () => {
    openLoadFile();
  });
};

/**
 * ファイルを開きます。
 */
function openLoadFile() {
  const win = BrowserWindow.getFocusedWindow();

  dialog.showOpenDialog(
    win,
    // どんなダイアログを出すかを指定するプロパティ
    {
      properties: ['openFile'],
      filters: [
        {
          name: 'Documents',
          extensions: ['txt', 'text', 'html', 'js']
        }
      ]
    },
    // [ファイル選択]ダイアログが閉じられた後のコールバック関数
    (fileNames) => {
      if (fileNames) {
        readFile(fileNames[0]);
      }
    });
}

/**
 * テキストを読み込み、テキストを入力エリアに設定します。
 */
function readFile(path) {
  currentPath = path;
  fs.readFile(path, (error, text) => {
    if (error != null) {
      alert('error : ' + error);
      return;
    }
    // フッター部分に読み込み先のパスを設定する
    footerArea.innerHTML = path;
    // テキスト入力エリアに設定する
    editor.setValue(text.toString(), -1);
  });
}

/**
 * ファイルを保存します。
 */
function saveFile() {

  //　初期の入力エリアに設定されたテキストを保存しようとしたときは新規ファイルを作成する
  if (currentPath === '') {
    saveNewFile();
    return;
  }

  const win = BrowserWindow.getFocusedWindow();

  dialog.showMessageBox(win, {
      title: 'ファイルの上書き保存を行います。',
      type: 'info',
      buttons: ['OK', 'Cancel'],
      detail: '本当に保存しますか？'
    },
    // メッセージボックスが閉じられた後のコールバック関数
    (response) => {
      // OKボタン(ボタン配列の0番目がOK)
      if (response === 0) {
        const data = editor.getValue();
        writeFile(currentPath, data);
      }
    }
  );
}

/**
 * ファイルを書き込みます。
 */
function writeFile(path, data) {
  fs.writeFile(path, data, (error) => {
    if (error != null) {
      alert('error : ' + error);
    }
  });
}

/**
 * 新規ファイルを保存します。
 */
function saveNewFile() {

  const win = BrowserWindow.getFocusedWindow();
  dialog.showSaveDialog(
    win,
    // どんなダイアログを出すかを指定するプロパティ
    {
      properties: ['openFile'],
      filters: [
        {
          name: 'Documents',
          extensions: ['txt', 'text', 'html', 'js']
        }
      ]
    },
    // セーブ用ダイアログが閉じられた後のコールバック関数
    (fileName) => {
      if (fileName) {
        const data = editor.getValue();
        currentPath = fileName;
        writeFile(currentPath, data);
      }
    }
  );
}
```
