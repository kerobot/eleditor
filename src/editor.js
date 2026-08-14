'use strict';

// アプリケーションのモジュール読み込み
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
    const filePath = window.electronAPI.getDroppedFilePath(file);
    if (filePath) {
      window.electronAPI.readDroppedFile(filePath).then(setFileContents).catch(showError);
    }
  });

  // IPCでメッセージを受信してファイルの制御を行う
  window.electronAPI.onFileCommand((arg) => {
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
  window.electronAPI.openFile().then((file) => {
    if (file) {
      setFileContents(file);
    }
  }).catch(showError);
}

// テキストを読み込み、テキストを入力エリアに設定
function setFileContents(file) {
  currentPath = file.filePath;
  footerArea.textContent = file.filePath;
  editor.setValue(file.text, -1);
}

function showError(error) {
  alert('error : ' + error);
}

// ファイルの保存
function saveFile() {
  //　初期の入力エリアに設定されたテキストを保存しようとしたときは新規ファイルを作成
  if (currentPath === '') {
    saveNewFile();
    return;
  }
  // ファイルの上書き保存を確認
  window.electronAPI.showMessageBox({
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
  window.electronAPI.saveFileDialog(currentPath).then((filePath) => {
    // ファイルを保存してファイルパスを記憶する
    if (filePath) {
      currentPath = filePath;
      const data = editor.getValue();
      writeFile(currentPath, data);
    }
  });
}

// テキストをファイルとして保存
function writeFile(path, data) {
  window.electronAPI.saveFile(path, data).catch(showError);
}