"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ConnectionCard } from "@/components/ConnectionCard";
import { ConnectionForm } from "@/components/ConnectionForm";
import { ProjectForm } from "@/components/ProjectForm";
import { Spinner } from "@/components/Spinner";
import { useToast } from "@/components/ToastContext";
import { Project, ProjectStatus } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ArrowLeft, Pencil, Trash2, Plus } from "lucide-react";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    let isMounted = true;

    params.then(({ id }) => {
      fetch(`/api/projects/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then((data) => {
          if (isMounted) {
            setProject(data.project);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setLoading(false);
          }
        });
    });

    return () => {
      isMounted = false;
    };
  }, [params]);

  const handleUpdate = async (data: { name: string; status: ProjectStatus }) => {
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("更新に失敗しました");
      setProject({ ...project, ...data });
      setShowEditForm(false);
      showToast("プロジェクトを更新しました", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "エラーが発生しました", "error");
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    setShowDeleteConfirm(false);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      showToast("プロジェクトを削除しました", "success");
      router.push("/");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "エラーが発生しました", "error");
    }
  };

  const refreshProject = useCallback(async () => {
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${project.id}`);
      if (!res.ok) throw new Error("取得に失敗しました");
      const data = await res.json();
      setProject(data.project);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "エラーが発生しました", "error");
    }
  }, [project, showToast]);

  if (loading) {
    return (
      <main className="flex-1 bg-background p-8 flex items-center justify-center">
        <Spinner size="lg" />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="flex-1 bg-background">
        <div className="container mx-auto max-w-4xl p-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" />
            プロジェクト一覧に戻る
          </Link>
          <p className="mt-4 text-destructive">プロジェクトが見つかりません</p>
        </div>
      </main>
    );
  }

  const isActionRequired = project.status === "action_required";

  return (
    <main className="flex-1 bg-background">
      <div className="container mx-auto max-w-4xl p-8">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="size-4" />
          プロジェクト一覧に戻る
        </Link>

        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant={isActionRequired ? "destructive" : "secondary"}>
              {isActionRequired ? "要アクション" : "待機中"}
            </Badge>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowEditForm(true)}>
              <Pencil className="size-4" />
              編集
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(true)} className="text-destructive hover:text-destructive">
              <Trash2 className="size-4" />
              削除
            </Button>
          </div>
        </div>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold">Connections</h2>
            <Button onClick={() => setShowConnectionForm(true)} size="sm">
              <Plus className="size-4" />
              コネクション追加
            </Button>
          </div>
          {project.connections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
              <p className="mb-1">Connectionがありません</p>
              <p className="text-sm">「コネクション追加」から作成してください</p>
            </div>
          ) : (
            <div className="space-y-3">
              {project.connections.map((conn) => (
                <ConnectionCard
                  key={conn.id}
                  connection={conn}
                  projectId={project.id}
                  onUpdate={refreshProject}
                />
              ))}
            </div>
          )}
        </section>

        {showEditForm && (
          <ProjectForm
            project={project}
            onSubmit={handleUpdate}
            onCancel={() => setShowEditForm(false)}
          />
        )}
        {showConnectionForm && (
          <ConnectionForm
            projectId={project.id}
            projectPath={project.path}
            onSubmit={() => {
              setShowConnectionForm(false);
              refreshProject();
            }}
            onCancel={() => setShowConnectionForm(false)}
          />
        )}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>プロジェクトの削除</AlertDialogTitle>
              <AlertDialogDescription>
                「{project.name}」を削除しますか？この操作は取り消せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                variant="destructive"
              >
                削除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  );
}
