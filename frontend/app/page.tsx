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
  // Emails shown in the main list (paged and filter-aware)
  const [emails, setEmails] = useState<Email[]>([]);
  // Accumulator for the sidebar. Never reset. De-duped by id.
  const [sidebarEmails, setSidebarEmails] = useState<Email[]>([]);

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

  function mergeById(prev: Email[], next: Email[]) {
    const seen = new Set(prev.map((e) => e.id));
    const merged = [...prev];
    for (const e of next) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        merged.push(e);
      }
    }
    return merged;
  }

  async function load(pageNum: number, resetMainList = false) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const pageSize = 10;

      // Add artificial delay only when scrolling beyond first page
      if (pageNum > 1) {
        await new Promise((resolve) => setTimeout(resolve, 700)); // 0.7s delay
      }

      const data = await getEmails(pageNum, pageSize, {
        folder: activeFolder,
        accountId: activeAccount,
        category: activeCategory,
      });

      const batch: Email[] = data?.data || [];

      setEmails((prev) => (resetMainList ? batch : mergeById(prev, batch)));
      setSidebarEmails((prev) => mergeById(prev, batch));

      // If the batch returned less than a page, stop further loads
      setHasMore(batch.length === pageSize);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  async function handleSearch(q: string) {
    if (!q.trim()) {
      // Exit search mode. Restore paginated list under current filters.
      setSearchMode(false);
      setEmails([]);
      setPage(1);
      setHasMore(true);
      await load(1, true);
      return;
    }

    setSearchMode(true);
    setLoading(true);
    try {
      const res = await searchEmails(q);
      const found: Email[] = Array.isArray(res)
        ? res.map((hit: any) => ({ id: hit._id, ...hit._source }))
        : [];

      // Do not touch sidebarEmails in search mode.
      setEmails(found);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  // Infinite scroll observer
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

          // call slightly before hitting bottom
          debounceTimeout = setTimeout(() => {
            setPage((p) => p + 1);
          }, 500); // slight visual delay for smoothness
        }
      },
      {
        root: null,
        rootMargin: "800px", // triggers 800px before bottom
        threshold: 0,
      }
    );

    observer.current.observe(elem);

    return () => {
      observer.current?.disconnect();
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  }, [
    searchMode,
    hasMore,
    activeFolder,
    activeAccount,
    activeCategory,
    emails.length,
  ]);

  // Load on page change
  useEffect(() => {
    if (!searchMode) load(page);
  }, [page, searchMode]);

  // On filter change: reset only the main list. Keep sidebar accumulator intact.
  useEffect(() => {
    setEmails([]);
    setPage(1);
    setHasMore(true);
    load(1, true);
  }, [activeFolder, activeAccount, activeCategory]);

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
        emails={sidebarEmails} // persistent, growing dataset for counts
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
        activeAccount={activeAccount}
        setActiveAccount={setActiveAccount}
      />

      <main className="flex-1 p-6 overflow-y-auto mt-[-55]">
        <SearchBar onSearch={handleSearch} />

        {loading && page === 1 && !searchMode && (
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
            className="mt-8 flex flex-col items-center justify-center gap-2 text-gray-600 transition-opacity duration-300"
            style={{ opacity: loading ? 1 : 0.6 }}
          >
            <div className="h-5 w-5 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 animate-spin" />
            <p className="text-sm font-medium text-gray-600 animate-pulse">
              {loading ? "Loading more emails..." : "Scroll for more"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
