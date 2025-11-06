"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const isDetailPage = pathname.startsWith("/emails/");

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white shadow-md border-b border-gray-800">
      <div className="flex justify-between items-center px-8 py-4">
        <div className="flex items-center gap-4">
          {isDetailPage && (
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
          )}

          <h1 className="text-xl font-semibold tracking-wide">Onebox</h1>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-300">
          <span className="hidden sm:inline">Synced: last 30 days</span>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
      </div>
    </header>
  );
}
