"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "handicrafts", label: "Handicrafts" },
  { value: "textiles", label: "Textiles" },
  { value: "jewelry", label: "Jewelry" },
  { value: "sellers", label: "Sellers" },
];

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(initialQuery || params.get("q") || "");
  const [cat, setCat] = useState(params.get("cat") || "all");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    const qs = new URLSearchParams({ q: trimmed });
    if (cat && cat !== "all") qs.set("cat", cat);
    router.push(`/search?${qs.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className="flex h-10 w-full items-stretch overflow-hidden rounded-md bg-white shadow-sm focus-within:ring-2 focus-within:ring-ring"
    >
      <label htmlFor="search-cat" className="sr-only">
        Search category
      </label>
      <select
        id="search-cat"
        value={cat}
        onChange={(e) => setCat(e.target.value)}
        className="h-full cursor-pointer rounded-l-md border-r border-border bg-muted px-2 text-xs font-medium text-foreground transition-colors duration-200 hover:bg-[#E7E9EC] focus:outline-none"
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <label htmlFor="search-q" className="sr-only">
        Search Bazaar
      </label>
      <input
        id="search-q"
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search Bazaar"
        autoComplete="off"
        className="h-full min-w-0 flex-1 bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />

      <button
        type="submit"
        aria-label="Search"
        className="flex h-full min-w-[44px] cursor-pointer items-center justify-center bg-primary px-4 text-primary-foreground transition-colors duration-200 hover:bg-[#F7CA00] focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <Search className="h-5 w-5" aria-hidden="true" />
      </button>
    </form>
  );
}
