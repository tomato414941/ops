# Ops Dashboard

Claude Code CLI セッションを Web UI で管理するダッシュボード。

## 機能

- プロジェクト・コネクション・セッションの管理
- Claude Code CLI / Agent SDK の2つの接続方式
- リアルタイムストリーミング表示
- ダークモード対応

## 必要条件

- Node.js 18+
- Claude Code CLI（`claude` コマンドが利用可能）
- Anthropic API キー（Agent SDK 使用時）

## セットアップ

```bash
npm install
npm run dev
```

http://localhost:3000 でアクセス

## 使い方

1. プロジェクトを作成
2. コネクションを追加（CLI or Agent SDK）
3. セッションを開始して対話

## 技術スタック

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Anthropic SDK

## License

MIT
