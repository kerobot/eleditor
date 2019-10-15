'use strict';

const {BrowserWindow, dialog} = require('electron').remote;
const fs = require('fs');

let inputArea = null;
let inputTxt = null;
let footerArea = null;
let currentPath = '';
let editor = null;

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

  // 「読込」ボタン
  document.querySelector('#btnLoad').addEventListener('click', () => {
    loadFile();
  });
  // 「保存」ボタン
  document.querySelector('#btnSave').addEventListener('click', () => {
    saveFile();
  });
}

// ファイルの読み込み
function loadFile() {
  const win = BrowserWindow.getFocusedWindow();
  // ファイルを開くダイアログ
  dialog.showOpenDialog(
    win,
    {
      properties: ['openFile'],
      filters: [{name: 'Documents', extensions: ['txt', 'text', 'html', 'js']}]
    },
    // ダイアログが閉じられた後のコールバック関数
    (fileNames) => {
      if (fileNames) {
        readFile(fileNames[0]);
      }
    });
}

// テキストを読み込み、テキストを入力エリアに設定
function readFile(path) {
  currentPath = path;
  fs.readFile(path, (error, text) => {
    if (error !== null) {
      alert('error : ' + error);
      return;
    }
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
      detail: 'ファイルを上書き保存します。よろしいですか？'
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

// テキストをファイルとして保存
function writeFile(path, data) {
  fs.writeFile(path, data, (error) => {
    if (error !== null) {
      alert('error : ' + error);
    }
  });
}

// 新規ファイルを保存
function saveNewFile() {
  const win = BrowserWindow.getFocusedWindow();
  // ファイルを保存するダイアログ
  dialog.showSaveDialog(
    win,
    {
      properties: ['saveFile'],
      filters: [{name: 'Documents', extensions: ['txt', 'text', 'html', 'js']}]
    },
    // ダイアログが閉じられた後のコールバック関数
    (fileName) => {
      if (fileName) {
        const data = editor.getValue();
        currentPath = fileName;
        writeFile(currentPath, data);
      }
    }
  );
}
