"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/shared/sidebar";
import EmailList from "@/components/emailList";
import SearchBar from "@/components/shared/searchBar";

import { getEmails, searchEmails } from "@/lib/api";
import { Email } from "@/types/email";
import Fallback from "@/components/utils/fallback";

export default function Page() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [cachedEmails, setCachedEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeFolder, setActiveFolder] = useState("All");
  const [searchMode, setSearchMode] = useState(false);
  const [activeAccount, setActiveAccount] = useState("All");

  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  async function loadEmails(pageNum: number) {
    setLoading(true);

    const data = await getEmails(pageNum, 10, {
      folder: activeFolder,
      accountId: activeAccount,
    });

    const newEmails: Email[] = data.data || [];

    setCachedEmails((prev) => {
      const ids = new Set(prev.map((e) => e.id));
      return [...prev, ...newEmails.filter((e) => !ids.has(e.id))];
    });

    setHasMore(newEmails.length > 0);
    setLoading(false);
  }

  async function handleSearch(q: string) {
    if (!q.trim()) {
      setSearchMode(false);
      setEmails(cachedEmails);
      return;
    }

    setLoading(true);
    setSearchMode(true);

    const res = await searchEmails(q);
    const found: Email[] = Array.isArray(res)
      ? res.map((hit: any) => ({
          id: hit._id,
          ...hit._source,
        }))
      : [];

    setEmails(found);
    setLoading(false);
  }

  // Infinite scroll observer with debounce
  useEffect(() => {
    if (searchMode || !hasMore) return;
    const elem = loadMoreRef.current;
    if (!elem) return;

    let timeout: NodeJS.Timeout | null = null;
    let canLoad = true;

    observer.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loading && canLoad) {
          canLoad = false;

          // Debounce next call by 2s
          timeout = setTimeout(() => {
            canLoad = true;
          }, 2000);

          setPage((p) => p + 1);
        }
      },
      {
        root: null,
        rootMargin: "200px", // trigger before bottom reaches viewport
        threshold: 0.1, // 10% visible
      }
    );

    observer.current.observe(elem);
    return () => {
      observer.current?.disconnect();
      if (timeout) clearTimeout(timeout);
    };
  }, [loading, searchMode, hasMore]);

  // fetch emails when page changes
  useEffect(() => {
    if (!searchMode) loadEmails(page);
  }, [page, searchMode]);

  const displayEmails = searchMode ? emails : cachedEmails;

  const filteredEmails = displayEmails.filter((e) => {
    const matchFolder = activeFolder === "All" || e.folder === activeFolder;
    const matchCategory =
      activeCategory === "All" || e.category === activeCategory;
    const matchAccount =
      activeAccount === "All" || e.accountId === activeAccount;
    return matchFolder && matchCategory && matchAccount;
  });

  useEffect(() => {
    if (!searchMode) {
      // Reset scroll and observer before reloading
      window.scrollTo({ top: 0, behavior: "instant" });
      observer.current?.disconnect();

      // Reset pagination + cache
      setCachedEmails([]);
      setPage(1);
      setHasMore(true);

      // Fetch fresh batch cleanly
      loadEmails(1);
    }
  }, [activeFolder, activeAccount]);

  return (
    <div className="flex min-h-screen pt-[60px]">
      <Sidebar
        emails={cachedEmails}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
        activeAccount={activeAccount}
        setActiveAccount={setActiveAccount}
      />

      <main className="flex-1 p-6 overflow-y-auto mt-[-55]">
        <SearchBar onSearch={handleSearch} />

        {loading && (
          <div className="text-center text-gray-500 mt-10">Loading...</div>
        )}

        {!loading && filteredEmails.length === 0 && (
          <Fallback
            type="inbox"
            title="No emails found"
            subtitle="Try adjusting your filters or search query."
          />
        )}

        {!loading && filteredEmails.length > 0 && (
          <EmailList emails={filteredEmails} />
        )}

        {!searchMode && hasMore && (
          <div
            ref={loadMoreRef}
            className="h-10 mt-4 text-center text-gray-500"
          >
            Loading more...
          </div>
        )}
      </main>
    </div>
  );
}
