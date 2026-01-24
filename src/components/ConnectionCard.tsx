"use client";

import { Connection, ClaudeCodeConnection, AgentSdkConnection } from "@/types/project";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConnectionForm } from "./ConnectionForm";

interface ConnectionCardProps {
  connection: Connection;
  projectId?: string;
  onUpdate?: () => void;
}

export function ConnectionCard({ connection, projectId, onUpdate }: ConnectionCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const isClaudeCode = connection.type === "claude_code_cli";
  const claudeCodeConn = isClaudeCode ? (connection as ClaudeCodeConnection) : null;
  const agentSdkConn = !isClaudeCode ? (connection as AgentSdkConnection) : null;

  const handleStartSession = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: connection.id }),
      });
      const data = await res.json();
      if (data.sessionId) {
        router.push(`/sessions/${data.sessionId}`);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId) return;
    if (!confirm(`「${connection.name}」を削除しますか？`)) return;
    await fetch(`/api/projects/${projectId}/connections/${connection.id}`, {
      method: "DELETE",
    });
    onUpdate?.();
  };

  const handleEditSubmit = () => {
    setShowEditForm(false);
    onUpdate?.();
  };

  return (
    <>
      <div className="p-4 rounded-lg border border-gray-300 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{connection.name}</h3>
              {projectId && (
                <>
                  <button
                    onClick={() => setShowEditForm(true)}
                    className="text-gray-400 hover:text-blue-600 p-1"
                    title="編集"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-gray-400 hover:text-red-600 p-1"
                    title="削除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            <span className="text-sm text-gray-500">
              {isClaudeCode ? "Claude Code CLI" : "Agent SDK"}
            </span>
            {claudeCodeConn && (
              <p className="text-xs text-gray-400 mt-1 font-mono">
                {claudeCodeConn.workingDir}
              </p>
            )}
            {agentSdkConn?.systemPrompt && (
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                {agentSdkConn.systemPrompt}
              </p>
            )}
          </div>
          <button
            onClick={handleStartSession}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "起動中..." : "セッション開始"}
          </button>
        </div>
      </div>
      {showEditForm && projectId && (
        <ConnectionForm
          projectId={projectId}
          connection={connection}
          onSubmit={handleEditSubmit}
          onCancel={() => setShowEditForm(false)}
        />
      )}
    </>
  );
}
