# Electron Editor

Electron を利用して作成した シンプルなテキストエディタです。

テキストエディタそのものの機能は Ace.js を利用して実現しています。

## 環境

* Windows x64
* Node.js 20 以上
* npm 10 以上

Electron 43 と `contextIsolation` に対応した構成です。Node.js のバージョンは
`npm install` 実行環境に合わせてください。

## 構築

プロジェクトを clone してディレクトリに移動します。

```powershell
> git clone https://github.com/kerobot/eleditor.git eleditor
> cd eleditor
```

依存するパッケージをインストールします。

```powershell
> npm install
```

## 実行

プログラムを実行します。

```powershell
> npm start
```

## パッケージ化

Windows x64 向けの配布物を `dist` に作成します。

```powershell
> npm run package
```
