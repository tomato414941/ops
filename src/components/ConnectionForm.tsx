"use client";

import { useState } from "react";
import { Connection, ConnectionType, ClaudeCodeConnection, AgentSdkConnection } from "@/types/project";

interface ConnectionFormProps {
  projectId: string;
  connection?: Connection;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ConnectionForm({ projectId, connection, onSubmit, onCancel }: ConnectionFormProps) {
  const [type, setType] = useState<ConnectionType>(connection?.type || "claude_code_cli");
  const [name, setName] = useState(connection?.name || "");
  const [workingDir, setWorkingDir] = useState(
    connection?.type === "claude_code_cli" ? (connection as ClaudeCodeConnection).workingDir : ""
  );
  const [systemPrompt, setSystemPrompt] = useState(
    connection?.type === "agent_sdk" ? (connection as AgentSdkConnection).systemPrompt || "" : ""
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      if (connection) {
        await fetch(`/api/projects/${projectId}/connections/${connection.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            workingDir: type === "claude_code_cli" ? workingDir.trim() : undefined,
            systemPrompt: type === "agent_sdk" ? systemPrompt.trim() : undefined,
          }),
        });
      } else {
        await fetch(`/api/projects/${projectId}/connections`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            name: name.trim(),
            workingDir: type === "claude_code_cli" ? workingDir.trim() : undefined,
            systemPrompt: type === "agent_sdk" ? systemPrompt.trim() : undefined,
          }),
        });
      }
      onSubmit();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {connection ? "コネクション編集" : "新規コネクション"}
        </h2>
        <form onSubmit={handleSubmit}>
          {!connection && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                タイプ
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ConnectionType)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="claude_code_cli">Claude Code CLI</option>
                <option value="agent_sdk">Agent SDK</option>
              </select>
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名前
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="コネクション名を入力"
              autoFocus
            />
          </div>
          {type === "claude_code_cli" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                作業ディレクトリ
              </label>
              <input
                type="text"
                value={workingDir}
                onChange={(e) => setWorkingDir(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="/home/user/projects/myapp"
              />
            </div>
          )}
          {type === "agent_sdk" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                システムプロンプト
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                placeholder="アシスタントの役割を記述..."
              />
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "保存中..." : connection ? "更新" : "作成"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
