"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectForm } from "@/components/ProjectForm";
import { Spinner } from "@/components/Spinner";
import { useToast } from "@/components/ToastContext";
import { Project, ProjectStatus } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Home() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("プロジェクトの取得に失敗しました");
      const data = await res.json();
      setProjects(data.projects);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "エラーが発生しました", "error");
    }
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) throw new Error("プロジェクトの取得に失敗しました");
        const data = await res.json();
        if (isMounted) {
          setProjects(data.projects);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          showToast(error instanceof Error ? error.message : "エラーが発生しました", "error");
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const handleCreate = async (data: { name: string; status: ProjectStatus }) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("プロジェクトの作成に失敗しました");
      setShowForm(false);
      showToast("プロジェクトを作成しました", "success");
      fetchProjects();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "エラーが発生しました", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      showToast("プロジェクトを削除しました", "success");
      fetchProjects();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "エラーが発生しました", "error");
    }
  };

  if (loading) {
    return (
      <main className="flex-1 bg-background p-8 flex items-center justify-center">
        <Spinner size="lg" />
      </main>
    );
  }

  return (
    <main className="flex-1 bg-background">
      <div className="container mx-auto max-w-6xl p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">プロジェクト</h1>
            <p className="text-muted-foreground mt-1">
              Claude Codeセッションを管理
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} size="lg">
            <Plus className="size-5" />
            新規作成
          </Button>
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-2">プロジェクトがありません</p>
            <p className="text-sm">「新規作成」ボタンから最初のプロジェクトを作成しましょう</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
      {showForm && (
        <ProjectForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      )}
    </main>
  );
}
