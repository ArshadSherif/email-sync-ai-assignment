"use client";

import Link from "next/link";
import { Email } from "@/types/email";
import { Mail, Folder, Tag, Clock } from "lucide-react";

interface EmailListProps {
  emails: Email[];
}

export default function EmailList({ emails }: EmailListProps) {
  return (
    <div className="flex flex-col gap-5">
      {emails.map((email) => (
        <Link
          key={email.id}
          href={`/emails/${email.id}`}
          className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-gray-300 transition-all duration-150 block"
        >
          {/* Top row: subject + date */}
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <p className="font-semibold text-gray-900 text-base group-hover:text-blue-700">
                {email.subject || "(No Subject)"}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {new Date(email.date).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
          </div>

          {/* Sender */}
          <p className="text-sm text-gray-600 mb-2">{email.from}</p>

          {/* Preview */}
          <div className="text-sm text-gray-700 line-clamp-2 mb-3">
            {email.body || email.text || "No content available."}
          </div>

          {/* Footer: Folder + Category */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Folder className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-medium">{email.folder || "Inbox"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Tag className="w-5 h-4 text-gray-400" />
              <span
                className={`px-2 py-0.5 rounded-full font-semibold text-[14px] ${
                  email.category === "Interested"
                    ? "bg-green-100 text-green-700"
                    : email.category === "Spam"
                    ? "bg-red-100 text-red-700"
                    : email.category === "Follow-up"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {email.category || "Uncategorized"}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
