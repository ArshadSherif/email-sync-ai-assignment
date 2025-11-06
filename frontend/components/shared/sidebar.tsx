"use client";

import { Email } from "@/types/email";
import { Folder, Tag, User } from "lucide-react";

interface SidebarProps {
  emails: Email[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  activeFolder: string;
  setActiveFolder: (f: string) => void;
  activeAccount: string;
  setActiveAccount: (a: string) => void;
}

export default function Sidebar({
  emails,
  activeCategory,
  setActiveCategory,
  activeFolder,
  setActiveFolder,
  activeAccount,
  setActiveAccount,
}: SidebarProps) {
  const categoryCounts = emails.reduce((acc, e) => {
    const cat = e.category || "Uncategorized";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const folderCounts = emails.reduce((acc, e) => {
    const f = e.folder || "Inbox";
    acc[f] = (acc[f] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const accountCounts = emails.reduce((acc, e) => {
    const a = e.accountId || "Unknown";
    acc[a] = (acc[a] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <aside className="w-72 bg-gray-100 border-r border-gray-300">
      <div className="fixed top-[60px] left-0 w-72 h-[calc(100vh-60px)] overflow-y-auto bg-gray-100 px-5 py-6 space-y-8">
        {/* Folders */}
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-4 border-b border-gray-200 pb-2">
            <Folder className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Folders</h2>
          </div>

          <ul className="space-y-2">
            {Object.entries(folderCounts).map(([f, count]) => (
              <li
                key={f}
                onClick={() => setActiveFolder(activeFolder === f ? "All" : f)}
                className={`flex justify-between items-center px-3 py-2 text-base rounded-md cursor-pointer transition ${
                  activeFolder === f
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{f}</span>
                <span
                  className={`min-w-[28px] h-6 flex items-center justify-center text-xs font-semibold rounded-full ${
                    activeFolder === f
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {count}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-4 border-b border-gray-200 pb-2">
            <Tag className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-800">Categories</h2>
          </div>

          <ul className="space-y-2">
            {Object.entries(categoryCounts).map(([cat, count]) => (
              <li
                key={cat}
                onClick={() =>
                  setActiveCategory(activeCategory === cat ? "All" : cat)
                }
                className={`flex justify-between items-center px-3 py-2 text-base rounded-md cursor-pointer transition ${
                  activeCategory === cat
                    ? "bg-green-100 text-green-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`min-w-[28px] h-6 flex items-center justify-center text-xs font-semibold rounded-full ${
                    activeCategory === cat
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {count}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Accounts */}
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-4 border-b border-gray-200 pb-2">
            <User className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-800">Accounts</h2>
          </div>

          <ul className="space-y-2">
            {Object.entries(accountCounts).map(([account, count]) => (
              <li
                key={account}
                onClick={() =>
                  setActiveAccount(activeAccount === account ? "All" : account)
                }
                className={`flex justify-between items-center px-3 py-2 text-base rounded-md cursor-pointer transition ${
                  activeAccount === account
                    ? "bg-purple-100 text-purple-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="truncate max-w-[150px]">{account}</span>
                <span
                  className={`min-w-[28px] h-6 flex items-center justify-center text-xs font-semibold rounded-full ${
                    activeAccount === account
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
