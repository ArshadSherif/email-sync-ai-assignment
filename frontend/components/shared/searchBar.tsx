"use client";

import { useState } from "react";

interface SearchBarProps {
  onSearch: (q: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(query.trim());
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 mb-6 bg-white border border-gray-300 rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/70 focus-within:border-indigo-400 transition"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 text-gray-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35m1.15-5.4A7.5 7.5 0 1110.5 3a7.5 7.5 0 017.3 8.25z"
        />
      </svg>

      <input
        type="text"
        placeholder="Search emails..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-grow bg-transparent outline-none text-gray-800 placeholder-gray-400"
      />

      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="text-gray-400 hover:text-gray-600 transition"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-1.5 rounded-full transition"
      >
        Search
      </button>
    </form>
  );
}
