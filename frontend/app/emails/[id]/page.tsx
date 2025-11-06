"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Email } from "@/types/email";
import { getEmailById, generateAIReply } from "@/lib/api";
import { Mail, User, Folder, Tag, Clock, Sparkles } from "lucide-react";

export default function EmailDetailPage() {
  const { id } = useParams();
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showHtml, setShowHtml] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await getEmailById(id as string);
      setEmail(res);
      setAiReply(res?.ai_reply?.text || null);
      setLoading(false);
    })();
  }, [id]);

  async function handleGenerateReply() {
    if (!email) return;
    setGenerating(true);
    const res = await generateAIReply(email, id as string);
    setAiReply(res.reply || "No reply generated.");
    setGenerating(false);
  }

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-600 text-lg">
        Loading email details...
      </div>
    );

  if (!email)
    return (
      <div className="flex justify-center items-center h-screen text-red-500 text-lg">
        Email not found.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6 flex justify-center">
      <div className="max-w-5xl w-full bg-white shadow-sm rounded-xl p-8 border border-gray-200">
        <div className="border-b border-gray-200 pb-5 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
              {email.subject || "(No Subject)"}
            </h1>
          </div>

          <div className="grid sm:grid-cols-2 gap-y-1 text-sm text-gray-700">
            <p className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-medium">From:</span> {email.from}
            </p>
            <p>
              <span className="font-medium">To:</span> {email.to}
            </p>
            <p className="flex items-center gap-2 text-gray-500 col-span-2 sm:col-span-1">
              <Clock className="w-4 h-4 text-gray-400" />
              {new Date(email.date).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowHtml((p) => !p)}
            className="px-4 py-1.5 text-sm rounded-md border border-gray-300 bg-gray-100 hover:bg-gray-200 transition font-medium"
          >
            {showHtml ? "Show Plain Text" : "Show HTML View"}
          </button>
        </div>

        <div className="border rounded-lg overflow-hidden min-h-[400px]">
          {showHtml && email.html ? (
            <iframe
              srcDoc={email.html}
              sandbox="allow-same-origin"
              className="w-full min-h-[600px] border-0"
            />
          ) : (
            <div className="p-5 text-gray-800 whitespace-pre-line text-sm leading-relaxed">
              {email.text || "No text content available."}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-blue-700 font-medium">
            <Folder className="w-4 h-4 text-blue-500" />
            {email.folder || "Inbox"}
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-full font-medium ${
              email.category === "Interested"
                ? "bg-green-50 border-green-100 text-green-700"
                : email.category === "Spam"
                ? "bg-red-50 border-red-100 text-red-700"
                : email.category === "Follow-up"
                ? "bg-yellow-50 border-yellow-100 text-yellow-700"
                : "bg-gray-50 border-gray-100 text-gray-700"
            }`}
          >
            <Tag className="w-4 h-4" />
            {email.category || "Uncategorized"}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-gray-700">
            <User className="w-4 h-4 text-gray-500" />
            {email.accountId}
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <button
            onClick={handleGenerateReply}
            disabled={generating}
            className="flex items-center justify-center gap-3 
             px-8 py-3.5 text-lg font-semibold 
             bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-500
             hover:from-fuchsia-700 hover:via-violet-700 hover:to-indigo-600
             text-white rounded-xl shadow-md
             transition-all duration-200
             disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-6 h-6 text-white" />
            {generating
              ? "Generating Reply..."
              : aiReply
              ? "Regenerate Reply"
              : "Generate AI Reply"}
          </button>
        </div>

        {aiReply && (
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h2 className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Suggested Reply
            </h2>
            <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {aiReply}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
