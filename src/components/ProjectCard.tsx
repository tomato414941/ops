"use client";

import Link from "next/link";
import { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const isActionRequired = project.status === "action_required";

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`「${project.name}」を削除しますか？`)) {
      onDelete?.(project.id);
    }
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <div
        className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
          isActionRequired
            ? "border-red-400 bg-red-50 hover:bg-red-100"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
        }`}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
          {onDelete && (
            <button
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-600 p-1"
              title="削除"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
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
    </Link>
  );
}
