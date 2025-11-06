"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/shared/sidebar";
import EmailList from "@/components/emailList";
import SearchBar from "@/components/shared/searchBar";
import { getEmails, searchEmails } from "@/lib/api";
import { Email } from "@/types/email";
import Fallback from "@/components/utils/fallback";
import EmailSkeleton from "@/components/utils/skeleton";

export default function Page() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchMode, setSearchMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeFolder, setActiveFolder] = useState("All");
  const [activeAccount, setActiveAccount] = useState("All");

  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  async function loadEmails(pageNum: number) {
    if (loadingRef.current) return; // prevent overlap
    loadingRef.current = true;
    setLoading(true);

    try {
      const data = await getEmails(pageNum, 20, {
        folder: activeFolder,
        accountId: activeAccount,
      });

      const newEmails: Email[] = data?.data || [];

      setEmails((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const merged = [
          ...prev,
          ...newEmails.filter((e) => !existingIds.has(e.id)),
        ];
        return merged;
      });

      setHasMore(newEmails.length > 0);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  async function handleSearch(q: string) {
    if (!q.trim()) {
      setSearchMode(false);
      setPage(1);
      return;
    }

    setSearchMode(true);
    setLoading(true);

    try {
      const res = await searchEmails(q);
      const found: Email[] = Array.isArray(res)
        ? res.map((hit: any) => ({
            id: hit._id,
            ...hit._source,
          }))
        : [];
      setEmails(found);
    } finally {
      setLoading(false);
    }
  }

  // scroll observer (trigger once user gets close to bottom)
  useEffect(() => {
    if (searchMode || !hasMore) return;
    const elem = loadMoreRef.current;
    if (!elem) return;

    let debounceTimeout: NodeJS.Timeout | null = null;

    observer.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loadingRef.current) {
          if (debounceTimeout) clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            setPage((p) => p + 1);
          }, 1000); 
        }
      },
      {
        root: null,
        rootMargin: "400px", 
        threshold: 0.3, 
      }
    );

    observer.current.observe(elem);
    return () => {
      observer.current?.disconnect();
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  }, [searchMode, hasMore]);

  useEffect(() => {
    if (!searchMode) loadEmails(page);
  }, [page, searchMode]);

  useEffect(() => {
    // reset cache only when folder/account changes
    setEmails([]);
    setPage(1);
    setHasMore(true);
    loadEmails(1);
  }, [activeFolder, activeAccount]);

  const filteredEmails = emails.filter((e) => {
    const matchFolder = activeFolder === "All" || e.folder === activeFolder;
    const matchCategory =
      activeCategory === "All" || e.category === activeCategory;
    const matchAccount =
      activeAccount === "All" || e.accountId === activeAccount;
    return matchFolder && matchCategory && matchAccount;
  });

  return (
    <div className="flex min-h-screen pt-[60px]">
      <Sidebar
        emails={emails}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
        activeAccount={activeAccount}
        setActiveAccount={setActiveAccount}
      />

      <main className="flex-1 p-6 overflow-y-auto mt-[-55]">
        <SearchBar onSearch={handleSearch} />

        {loading && page === 1 && (
          <div className="p-6">
            <EmailSkeleton />
          </div>
        )}

        {!loading && filteredEmails.length === 0 && (
          <Fallback
            type="inbox"
            title="No emails found"
            subtitle="Try adjusting your filters or search query."
          />
        )}

        {filteredEmails.length > 0 && <EmailList emails={filteredEmails} />}

        {!searchMode && hasMore && (
          <div
            ref={loadMoreRef}
            className="mt-8 flex flex-col items-center justify-center gap-2 text-gray-600"
          >
            <div className="h-5 w-5 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 animate-spin" />
            <p className="text-sm font-medium text-gray-600 animate-pulse">
              Loading more emails...
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
