"use client";

import { useState } from "react";
import { Connection, ConnectionType, ClaudeCodeConnection, AgentSdkConnection } from "@/types/project";
import { useToast } from "./ToastContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConnectionFormProps {
  projectId: string;
  connection?: Connection;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ConnectionForm({ projectId, connection, onSubmit, onCancel }: ConnectionFormProps) {
  const { showToast } = useToast();
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
      const url = connection
        ? `/api/projects/${projectId}/connections/${connection.id}`
        : `/api/projects/${projectId}/connections`;
      const method = connection ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: connection ? undefined : type,
          name: name.trim(),
          workingDir: type === "claude_code_cli" ? workingDir.trim() : undefined,
          systemPrompt: type === "agent_sdk" ? systemPrompt.trim() : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("保存に失敗しました");
      }

      showToast(connection ? "コネクションを更新しました" : "コネクションを作成しました", "success");
      onSubmit();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "エラーが発生しました", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {connection ? "コネクション編集" : "新規コネクション"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!connection && (
            <div className="space-y-2">
              <Label htmlFor="type">タイプ</Label>
              <Select value={type} onValueChange={(v) => setType(v as ConnectionType)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude_code_cli">Claude Code CLI</SelectItem>
                  <SelectItem value="agent_sdk">Agent SDK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">名前</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="コネクション名を入力"
              autoFocus
            />
          </div>
          {type === "claude_code_cli" && (
            <div className="space-y-2">
              <Label htmlFor="workingDir">作業ディレクトリ</Label>
              <Input
                id="workingDir"
                type="text"
                value={workingDir}
                onChange={(e) => setWorkingDir(e.target.value)}
                placeholder="/home/user/projects/myapp"
                className="font-mono text-sm"
              />
            </div>
          )}
          {type === "agent_sdk" && (
            <div className="space-y-2">
              <Label htmlFor="systemPrompt">システムプロンプト</Label>
              <textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="アシスタントの役割を記述..."
              />
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "保存中..." : connection ? "更新" : "作成"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
