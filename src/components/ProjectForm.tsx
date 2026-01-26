"use client";

import { useState } from "react";
import { Project, ProjectStatus } from "@/types/project";
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

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: { name: string; status: ProjectStatus }) => Promise<void>;
  onCancel: () => void;
}

export function ProjectForm({ project, onSubmit, onCancel }: ProjectFormProps) {
  const [name, setName] = useState(project?.name || "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status || "waiting");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit({ name: name.trim(), status });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {project ? "プロジェクト編集" : "新規プロジェクト"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">プロジェクト名</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="プロジェクト名を入力"
              autoFocus
            />
          </div>
          {project && (
            <div className="space-y-2">
              <Label htmlFor="status">ステータス</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="waiting">待機中</SelectItem>
                  <SelectItem value="action_required">要アクション</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "保存中..." : project ? "更新" : "作成"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
