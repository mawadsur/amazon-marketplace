"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Search, X } from "lucide-react";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "handicrafts", label: "Handicrafts" },
  { value: "textiles", label: "Textiles" },
  { value: "jewelry", label: "Jewelry" },
  { value: "sellers", label: "Sellers" },
];

const RECENT_KEY = "bazaar.recentSearches";
const MAX_RECENT = 6;

type Suggestion =
  | { kind: "product"; slug: string; title: string; priceUsdCents: number; image: string | null }
  | { kind: "shop"; slug: string; name: string; region: string; logoUrl: string | null }
  | { kind: "category"; slug: string; name: string }
  | { kind: "recent"; text: string }
  | { kind: "raw"; text: string };

type SuggestResponse = {
  products: { slug: string; title: string; priceUsdCents: number; image: string | null }[];
  shops: { slug: string; name: string; region: string; logoUrl: string | null }[];
  categories: { slug: string; name: string }[];
};

// Web Speech API types — minimal, since the DOM lib does not ship them.
type SpeechRecognitionResult = {
  isFinal: boolean;
  0: { transcript: string };
};
type SpeechRecognitionEvent = { results: { length: number; 0: SpeechRecognitionResult; [k: number]: SpeechRecognitionResult } };
type SpeechRecognitionErrorEvent = { error: string };
type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s): s is string => typeof s === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  if (typeof window === "undefined") return;
  const trimmed = query.trim();
  if (!trimmed) return;
  try {
    const current = loadRecent().filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
    const next = [trimmed, ...current].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private-mode errors
  }
}

function clearRecent() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RECENT_KEY);
  } catch {
    /* ignore */
  }
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(initialQuery || params.get("q") || "");
  const [cat, setCat] = useState(params.get("cat") || "all");

  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);

  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [micSupported, setMicSupported] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  // Detect mic support on mount.
  useEffect(() => {
    setMicSupported(Boolean(getSpeechRecognition()));
    setRecent(loadRecent());
  }, []);

  // Click-outside to close.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!formRef.current) return;
      if (!formRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  // Debounced fetch for suggestions.
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions(null);
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`, {
        signal: ctrl.signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as SuggestResponse;
      setSuggestions(data);
    } catch (err) {
      if ((err as { name?: string })?.name !== "AbortError") {
        setSuggestions({ products: [], shops: [], categories: [] });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!open) return;
    debounceRef.current = window.setTimeout(() => fetchSuggestions(q), 180);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q, open, fetchSuggestions]);

  // Flatten suggestions into a single list so arrow keys can navigate it.
  const flat = useMemo<Suggestion[]>(() => {
    const items: Suggestion[] = [];
    if (q.trim().length < 2) {
      // Empty / short query: show recents only.
      for (const r of recent) items.push({ kind: "recent", text: r });
      return items;
    }
    // Always include the raw query as the first option, so Enter at any point
    // performs a literal search.
    items.push({ kind: "raw", text: q.trim() });
    if (!suggestions) return items;
    for (const c of suggestions.categories) items.push({ kind: "category", ...c });
    for (const s of suggestions.shops) items.push({ kind: "shop", ...s });
    for (const p of suggestions.products) items.push({ kind: "product", ...p });
    return items;
  }, [q, suggestions, recent]);

  // Reset highlight when list reshapes.
  useEffect(() => {
    setHighlight(-1);
  }, [flat.length]);

  function submitQuery(text: string, catOverride?: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    saveRecent(trimmed);
    setRecent(loadRecent());
    const qs = new URLSearchParams({ q: trimmed });
    const useCat = catOverride ?? cat;
    if (useCat && useCat !== "all") qs.set("cat", useCat);
    router.push(`/search?${qs.toString()}`);
    setOpen(false);
  }

  function navigateToSuggestion(s: Suggestion) {
    setOpen(false);
    if (s.kind === "product") {
      router.push(`/products/${s.slug}`);
    } else if (s.kind === "shop") {
      router.push(`/shop/${s.slug}`);
    } else if (s.kind === "category") {
      router.push(`/shop/category/${s.slug}`);
    } else {
      // recent or raw — perform a search
      setQ(s.text);
      submitQuery(s.text);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (highlight >= 0 && flat[highlight]) {
      navigateToSuggestion(flat[highlight]);
      return;
    }
    submitQuery(q);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(flat.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(-1, h - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlight(-1);
    }
  }

  function startListening() {
    setMicError(null);
    const SR = getSpeechRecognition();
    if (!SR) {
      setMicError("Voice search isn't supported in this browser.");
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (event) => {
      const lastIndex = event.results.length - 1;
      const transcript = event.results[lastIndex][0].transcript;
      setQ(transcript);
      if (event.results[lastIndex].isFinal) {
        rec.stop();
        // Submit shortly after final transcript arrives.
        setTimeout(() => submitQuery(transcript), 50);
      }
    };
    rec.onerror = (e) => {
      const msg =
        e.error === "not-allowed"
          ? "Microphone permission denied. Enable it in your browser settings."
          : e.error === "no-speech"
            ? "Didn't catch that — try again."
            : `Voice error: ${e.error}`;
      setMicError(msg);
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
      setOpen(true);
      inputRef.current?.focus();
    } catch {
      setListening(false);
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function onMicClick() {
    if (listening) stopListening();
    else startListening();
  }

  const showDropdown = Boolean(open && (flat.length > 0 || loading || listening || micError));

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      role="search"
      className="relative flex h-10 w-full items-stretch overflow-visible rounded-md bg-white shadow-sm focus-within:ring-2 focus-within:ring-ring"
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
        ref={inputRef}
        id="search-q"
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={listening ? "Listening..." : "Search Bazaar"}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls="search-suggestions"
        aria-autocomplete="list"
        aria-activedescendant={highlight >= 0 ? `sugg-${highlight}` : undefined}
        className={`h-full min-w-0 flex-1 bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none ${
          listening ? "placeholder:text-destructive" : ""
        }`}
      />

      {q ? (
        <button
          type="button"
          onClick={() => {
            setQ("");
            inputRef.current?.focus();
            setOpen(true);
          }}
          aria-label="Clear search"
          className="flex h-full w-8 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}

      {micSupported ? (
        <button
          type="button"
          onClick={onMicClick}
          aria-label={listening ? "Stop voice search" : "Search by voice"}
          aria-pressed={listening}
          title={listening ? "Listening..." : "Search by voice"}
          className={`flex h-full w-10 cursor-pointer items-center justify-center border-l border-border transition-colors duration-150 ${
            listening
              ? "bg-destructive/10 text-destructive"
              : "bg-white text-muted-foreground hover:text-foreground"
          }`}
        >
          {listening ? (
            <Mic className="h-5 w-5 animate-pulse" aria-hidden="true" />
          ) : (
            <Mic className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      ) : null}

      <button
        type="submit"
        aria-label="Search"
        className="flex h-full min-w-[44px] cursor-pointer items-center justify-center rounded-r-md bg-primary px-4 text-primary-foreground transition-colors duration-200 hover:bg-[#F7CA00] focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <Search className="h-5 w-5" aria-hidden="true" />
      </button>

      {showDropdown ? (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+2px)] z-50 max-h-[60vh] overflow-y-auto rounded-md border border-border bg-white shadow-lg"
        >
          {listening ? (
            <div className="flex items-center gap-2 border-b border-border bg-destructive/5 px-4 py-2 text-sm text-destructive">
              <Mic className="h-4 w-4 animate-pulse" aria-hidden="true" />
              <span>Listening... speak now.</span>
              <button
                type="button"
                onClick={stopListening}
                className="ml-auto text-xs underline"
              >
                Stop
              </button>
            </div>
          ) : null}

          {micError ? (
            <div className="flex items-center gap-2 border-b border-border bg-destructive/5 px-4 py-2 text-xs text-destructive">
              <MicOff className="h-4 w-4" aria-hidden="true" />
              <span>{micError}</span>
            </div>
          ) : null}

          {loading && flat.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              Searching...
            </p>
          ) : null}

          {q.trim().length < 2 && recent.length > 0 ? (
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              <span>Recent searches</span>
              <button
                type="button"
                onClick={() => {
                  clearRecent();
                  setRecent([]);
                }}
                className="text-[10px] underline hover:text-foreground"
              >
                Clear
              </button>
            </div>
          ) : null}

          <ul>
            {flat.map((s, i) => {
              const isActive = i === highlight;
              const key =
                s.kind === "product"
                  ? `p-${s.slug}`
                  : s.kind === "shop"
                    ? `s-${s.slug}`
                    : s.kind === "category"
                      ? `c-${s.slug}`
                      : `${s.kind}-${s.text}-${i}`;
              return (
                <li
                  key={key}
                  id={`sugg-${i}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => {
                    // mousedown (not click) so it fires before input blur
                    e.preventDefault();
                    navigateToSuggestion(s);
                  }}
                  className={`flex cursor-pointer items-center gap-3 border-b border-border/60 px-4 py-2 text-sm last:border-b-0 ${
                    isActive ? "bg-muted" : "hover:bg-muted/60"
                  }`}
                >
                  {s.kind === "product" ? (
                    <>
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-sm border border-border bg-muted">
                        {s.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={s.image}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-contain"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-foreground">{s.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatUsd(s.priceUsdCents)}
                        </p>
                      </div>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Product
                      </span>
                    </>
                  ) : s.kind === "shop" ? (
                    <>
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-sm border border-border bg-muted">
                        {s.logoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={s.logoUrl}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.region}</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Shop
                      </span>
                    </>
                  ) : s.kind === "category" ? (
                    <>
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm bg-muted text-xs font-medium text-muted-foreground">
                        #
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Browse category
                        </p>
                      </div>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Category
                      </span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="flex-1 truncate text-foreground">
                        {s.kind === "raw" ? (
                          <>
                            Search Bazaar for{" "}
                            <span className="font-medium">&ldquo;{s.text}&rdquo;</span>
                          </>
                        ) : (
                          s.text
                        )}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {s.kind === "raw" ? "Search" : "Recent"}
                      </span>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </form>
  );
}
