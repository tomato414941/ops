"use client";

import { useState, useRef, useEffect } from "react";
import { Message } from "@/types/project";

interface SessionViewProps {
  sessionId: string;
  initialMessages: Message[];
}

export function SessionView({ sessionId, initialMessages }: SessionViewProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamOutput, setStreamOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamOutput]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamOutput("");
    setError(null);

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6));
                if (event.type === "stream_event" && event.event?.type === "content_block_delta") {
                  const delta = event.event.delta;
                  if (delta?.type === "text_delta" && delta.text) {
                    fullContent += delta.text;
                    setStreamOutput(fullContent);
                  }
                } else if (event.type === "error") {
                  const errorMsg = event.error || "Unknown error";
                  if (errorMsg.includes("authentication") || errorMsg.includes("apiKey") || errorMsg.includes("API key") || errorMsg.includes("x-api-key")) {
                    setError("APIキーが設定されていません。.env.local に ANTHROPIC_API_KEY を設定してください。");
                  } else {
                    setError(errorMsg);
                  }
                  setStreamOutput("");
                } else if (event.type === "done" || event.type === "result") {
                  if (fullContent) {
                    const assistantMessage: Message = {
                      id: Date.now().toString(),
                      role: "assistant",
                      content: fullContent,
                      timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, assistantMessage]);
                  }
                  setStreamOutput("");
                }
              } catch {
                // Skip non-JSON lines
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">エラー</span>
          </div>
          <p className="mt-2">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm underline hover:no-underline"
          >
            閉じる
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg ${
              msg.role === "user"
                ? "bg-blue-100 ml-8"
                : "bg-gray-100 mr-8"
            }`}
          >
            <div className="text-xs text-gray-500 mb-1">
              {msg.role === "user" ? "You" : "Claude"}
            </div>
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}
        {streamOutput && (
          <div className="p-3 rounded-lg bg-gray-100 mr-8">
            <div className="text-xs text-gray-500 mb-1">Claude</div>
            <div className="whitespace-pre-wrap">{streamOutput}</div>
          </div>
        )}
        {isLoading && !streamOutput && (
          <div className="p-3 rounded-lg bg-gray-100 mr-8">
            <div className="text-xs text-gray-500 mb-1">Claude</div>
            <div className="text-gray-400">thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            送信
          </button>
        </div>
      </form>
    </div>
  );
}
