"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SessionView } from "@/components/SessionView";
import { useEffect, useState } from "react";
import { Message } from "@/types/project";

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export default function SessionPage({ params }: SessionPageProps) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => {
      setSessionId(id);
      fetch(`/api/sessions/${id}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Session not found");
          }
          return res.json();
        })
        .then((data) => {
          setMessages(data.messages || []);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    });
  }, [params]);

  const handleEndSession = async () => {
    if (!sessionId) return;
    if (!confirm("セッションを終了しますか？")) return;
    await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    router.push("/");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (error || !sessionId) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <Link href="/" className="text-blue-600 hover:underline">
          &larr; プロジェクト一覧に戻る
        </Link>
        <p className="mt-4 text-red-600">セッションが見つかりません</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="bg-white border-b px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="text-blue-600 hover:underline">
              &larr; プロジェクト一覧に戻る
            </Link>
            <h1 className="text-xl font-bold text-gray-900 mt-2">
              Session: {sessionId.slice(0, 8)}...
            </h1>
          </div>
          <button
            onClick={handleEndSession}
            className="px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50"
          >
            セッション終了
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <SessionView sessionId={sessionId} initialMessages={messages} />
      </div>
    </main>
  );
}
