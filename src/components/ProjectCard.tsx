"use client";

import Link from "next/link";
import { useState } from "react";
import { Project } from "@/types/project";
import { Card, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
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
import { Trash2 } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const isActionRequired = project.status === "action_required";

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowConfirm(false);
    onDelete?.(project.id);
  };

  return (
    <>
      <Link href={`/projects/${project.id}`}>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            isActionRequired
              ? "border-destructive/50 bg-destructive/5 hover:bg-destructive/10"
              : "hover:border-primary/30"
          }`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{project.name}</CardTitle>
            {onDelete && (
              <CardAction>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleDeleteClick}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <div className="px-6 pb-4">
            <Badge variant={isActionRequired ? "destructive" : "secondary"}>
              {isActionRequired ? "要アクション" : "待機中"}
            </Badge>
          </div>
        </Card>
      </Link>
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
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
              onClick={handleConfirmDelete}
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
