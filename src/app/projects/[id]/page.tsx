"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectionCard } from "@/components/ConnectionCard";
import { ConnectionForm } from "@/components/ConnectionForm";
import { ProjectForm } from "@/components/ProjectForm";
import { Project, ProjectStatus } from "@/types/project";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showConnectionForm, setShowConnectionForm] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/projects/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then((data) => {
          setProject(data.project);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    });
  }, [params]);

  const handleUpdate = async (data: { name: string; status: ProjectStatus }) => {
    if (!project) return;
    await fetch(`/api/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setProject({ ...project, ...data });
    setShowEditForm(false);
  };

  const handleDelete = async () => {
    if (!project) return;
    if (!confirm(`「${project.name}」を削除しますか？`)) return;
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    router.push("/");
  };

  const refreshProject = async () => {
    if (!project) return;
    const res = await fetch(`/api/projects/${project.id}`);
    const data = await res.json();
    setProject(data.project);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <Link href="/" className="text-blue-600 hover:underline">
          &larr; プロジェクト一覧に戻る
        </Link>
        <p className="mt-4 text-red-600">プロジェクトが見つかりません</p>
      </main>
    );
  }

  const isActionRequired = project.status === "action_required";

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
        &larr; プロジェクト一覧に戻る
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <button
            onClick={() => setShowEditForm(true)}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-600 rounded"
          >
            編集
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-600 rounded"
          >
            削除
          </button>
        </div>
        <span
          className={`inline-block mt-2 px-2 py-1 text-sm rounded ${
            isActionRequired
              ? "bg-red-200 text-red-800"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {isActionRequired ? "要アクション" : "待機中"}
        </span>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Connections</h2>
          <button
            onClick={() => setShowConnectionForm(true)}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            コネクション追加
          </button>
        </div>
        {project.connections.length === 0 ? (
          <p className="text-gray-500">Connectionがありません</p>
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
          onSubmit={() => {
            setShowConnectionForm(false);
            refreshProject();
          }}
          onCancel={() => setShowConnectionForm(false)}
        />
      )}
    </main>
  );
}
