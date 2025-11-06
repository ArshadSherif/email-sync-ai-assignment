"use client";

import { Mail, Inbox, SearchX } from "lucide-react";

interface FallbackProps {
  title?: string;
  subtitle?: string;
  type?: "empty" | "search" | "inbox";
}

export default function Fallback({
  title = "No data found",
  subtitle = "Try adjusting your filters or search query.",
  type = "empty",
}: FallbackProps) {
  const Icon = type === "search" ? SearchX : type === "inbox" ? Inbox : Mail;

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
      <Icon className="w-12 h-12 mb-3 text-gray-400" />
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm text-gray-400">{subtitle}</p>
    </div>
  );
}
