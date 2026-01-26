"use client";

import { Connection, ClaudeCodeConnection, AgentSdkConnection } from "@/types/project";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConnectionForm } from "./ConnectionForm";
import { useToast } from "./ToastContext";
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Play } from "lucide-react";

interface ConnectionCardProps {
  connection: Connection;
  projectId?: string;
  onUpdate?: () => void;
}

export function ConnectionCard({ connection, projectId, onUpdate }: ConnectionCardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      } else {
        throw new Error(data.error || "セッションの作成に失敗しました");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "セッションの起動に失敗しました", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId) return;
    setShowDeleteConfirm(false);
    try {
      const res = await fetch(`/api/projects/${projectId}/connections/${connection.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("削除に失敗しました");
      }
      showToast("コネクションを削除しました", "success");
      onUpdate?.();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "削除に失敗しました", "error");
    }
  };

  const handleEditSubmit = () => {
    setShowEditForm(false);
    onUpdate?.();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{connection.name}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {isClaudeCode ? "CLI" : "SDK"}
            </Badge>
          </div>
          <CardDescription className="font-mono text-xs">
            {claudeCodeConn?.workingDir}
            {agentSdkConn?.systemPrompt && (
              <span className="line-clamp-1">{agentSdkConn.systemPrompt}</span>
            )}
          </CardDescription>
          <CardAction className="flex items-center gap-1">
            {projectId && (
              <>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setShowEditForm(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </>
            )}
            <Button onClick={handleStartSession} disabled={isLoading} size="sm">
              <Play className="size-4" />
              {isLoading ? "起動中..." : "開始"}
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
      {showEditForm && projectId && (
        <ConnectionForm
          projectId={projectId}
          connection={connection}
          onSubmit={handleEditSubmit}
          onCancel={() => setShowEditForm(false)}
        />
      )}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>コネクションの削除</AlertDialogTitle>
            <AlertDialogDescription>
              「{connection.name}」を削除しますか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
