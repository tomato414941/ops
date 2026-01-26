"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SessionView } from "@/components/SessionView";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Spinner } from "@/components/Spinner";
import { useToast } from "@/components/ToastContext";
import { Message } from "@/types/project";

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export default function SessionPage({ params }: SessionPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  useEffect(() => {
    let isMounted = true;

    params.then(({ id }) => {
      if (isMounted) setSessionId(id);
      fetch(`/api/sessions/${id}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Session not found");
          }
          return res.json();
        })
        .then((data) => {
          if (isMounted) {
            setMessages(data.messages || []);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(err.message);
            setLoading(false);
          }
        });
    });

    return () => {
      isMounted = false;
    };
  }, [params]);

  const handleEndSession = async () => {
    if (!sessionId) return;
    setShowEndConfirm(false);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("セッションの終了に失敗しました");
      showToast("セッションを終了しました", "success");
      router.push("/");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "エラーが発生しました", "error");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <Spinner size="lg" />
      </main>
    );
  }

  if (error || !sessionId) {
    return (
      <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          &larr; プロジェクト一覧に戻る
        </Link>
        <p className="mt-4 text-red-600 dark:text-red-400">セッションが見つかりません</p>
      </main>
    );
  }

  return (
    <main className="h-dvh bg-gray-100 dark:bg-gray-900 flex flex-col">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
              &larr; プロジェクト一覧に戻る
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              Session: {sessionId.slice(0, 8)}...
            </h1>
          </div>
          <button
            onClick={() => setShowEndConfirm(true)}
            className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            セッション終了
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 max-w-4xl mx-auto w-full flex flex-col">
        <SessionView sessionId={sessionId} initialMessages={messages} />
      </div>

      <ConfirmDialog
        isOpen={showEndConfirm}
        title="セッションの終了"
        message="セッションを終了しますか？"
        confirmLabel="終了"
        variant="danger"
        onConfirm={handleEndSession}
        onCancel={() => setShowEndConfirm(false)}
      />
    </main>
  );
}
