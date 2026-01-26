# CLAUDE.md

## Commands

```bash
npm run dev              # 開発サーバー (port 3000)
npm run dev -- --hostname 0.0.0.0  # リモートアクセス用
npm run dev:clean        # キャッシュクリア後に起動
npm run build            # プロダクションビルド
npm run lint             # ESLint
npm run test             # Vitest
```

## Architecture

Next.js ダッシュボード。Claude Code CLI セッションを Web UI で管理。

### Core Flow
1. Project → Connection → Session を選択/作成
2. Connection タイプに応じて処理:
   - claude_code_cli: CLI プロセスをスポーン
   - agent_sdk: Anthropic SDK でストリーミング
3. SSE でブラウザにリアルタイム配信

### Key Files
- `src/lib/claude-cli.ts` - CLI プロセス実行
- `src/lib/anthropic.ts` - Anthropic SDK ストリーミング
- `src/app/api/sessions/[id]/route.ts` - SSE エンドポイント
- `src/components/SessionView.tsx` - チャット UI
- `src/data/dummy.ts` - インメモリデータストア

### Data Model
- Project has many Connections
- Connection: claude_code_cli (workingDir) or agent_sdk (systemPrompt)
- Session belongs to Connection, stores Messages

### Directory Structure
```
src/
├── app/           # Next.js App Router (pages, API routes)
├── components/    # React components + shadcn/ui
├── lib/           # Utilities (claude-cli, anthropic, logger)
├── data/          # Data store (dummy.ts, storage.ts)
└── types/         # TypeScript definitions
```
