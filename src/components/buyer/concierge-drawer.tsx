"use client";

// Mirage Concierge — a multi-turn, voice-capable shopping assistant in a
// right-side sheet. Conversation state lives in sessionStorage; all intent
// logic runs server-side via /api/concierge/chat (so this stays a thin client).

import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Sparkles, Mic, Send, X, Volume2, VolumeX } from "lucide-react";
import { ProductCard } from "@/components/buyer/product-card";
import { useSpeechRecognition } from "@/components/buyer/use-speech-recognition";
import { cn } from "@/lib/utils";
import type { SearchIntent, RemovableChip, ConciergeTurn } from "@/lib/concierge";

const STORAGE_KEY = "mirage.concierge";

type CardResult = {
  id: string;
  slug: string;
  title: string;
  priceUsdCents: number;
  images: { url: string }[];
  shop: {
    name: string;
    slug: string;
    region: string | null;
    badge: string | null;
    trustScore: number | null;
    manualTier: string | null;
  };
};

type ChatResponse = {
  intent: SearchIntent;
  chips: RemovableChip[];
  results: CardResult[];
  assistantReply: string;
  reset: boolean;
  suggestion: { facet: string; value: string; label: string } | null;
};

type Persisted = {
  intent: SearchIntent | null;
  turns: ConciergeTurn[];
  chips: RemovableChip[];
  results: CardResult[];
};

const EXAMPLES = [
  "wedding saree from Mumbai under $200",
  "now show cheaper ones",
  "only silk",
];

export function ConciergeDrawer() {
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<SearchIntent | null>(null);
  const [turns, setTurns] = useState<ConciergeTurn[]>([]);
  const [chips, setChips] = useState<RemovableChip[]>([]);
  const [results, setResults] = useState<CardResult[]>([]);
  const [suggestion, setSuggestion] = useState<ChatResponse["suggestion"]>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceReplies, setVoiceReplies] = useState(false);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  // Hydrate from sessionStorage on first open.
  useEffect(() => {
    if (!open) return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Persisted;
        setIntent(p.intent ?? null);
        setTurns(p.turns ?? []);
        setChips(p.chips ?? []);
        setResults(p.results ?? []);
      }
    } catch {
      /* ignore */
    }
  }, [open]);

  const persist = useCallback((next: Persisted) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota / private-mode */
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!voiceReplies || !text || typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    } catch {
      /* ignore */
    }
  }, [voiceReplies]);

  // Core: post a turn (utterance) or a chip removal to the endpoint.
  const sendToServer = useCallback(
    async (
      body: { utterance?: string; remove?: { facet: string; value: string } },
      optimisticTurns: ConciergeTurn[],
    ) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/concierge/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ priorIntent: intent, history: turns, ...body }),
        });
        if (!res.ok) {
          setError("The concierge is unavailable right now.");
          return;
        }
        const data = (await res.json()) as ChatResponse;
        const nextTurns: ConciergeTurn[] = data.reset
          ? []
          : data.assistantReply
            ? [...optimisticTurns, { role: "assistant", text: data.assistantReply }]
            : optimisticTurns;
        setIntent(data.reset ? null : data.intent);
        setChips(data.reset ? [] : data.chips);
        setResults(data.reset ? [] : data.results);
        setSuggestion(data.suggestion);
        setTurns(nextTurns);
        persist({
          intent: data.reset ? null : data.intent,
          turns: nextTurns,
          chips: data.reset ? [] : data.chips,
          results: data.reset ? [] : data.results,
        });
        speak(data.assistantReply);
      } catch {
        setError("Network error — please try again.");
      } finally {
        setLoading(false);
      }
    },
    [intent, turns, persist, speak],
  );

  const send = useCallback(
    (utterance: string) => {
      const text = utterance.trim();
      if (!text || loading) return;
      const optimistic: ConciergeTurn[] = [...turns, { role: "user", text }];
      setTurns(optimistic);
      setInput("");
      void sendToServer({ utterance: text }, optimistic);
    },
    [turns, loading, sendToServer],
  );

  const removeChip = useCallback(
    (chip: RemovableChip) => {
      if (loading) return;
      void sendToServer({ remove: { facet: chip.facet, value: chip.value } }, turns);
    },
    [loading, turns, sendToServer],
  );

  const startOver = useCallback(() => {
    setIntent(null);
    setTurns([]);
    setChips([]);
    setResults([]);
    setSuggestion(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const speech = useSpeechRecognition({
    continuous: false,
    onInterim: (t) => setInput(t),
    onFinal: (t) => {
      setVoiceReplies(true);
      send(t);
    },
    onError: (m) => setError(m),
  });

  // Auto-scroll transcript on new turns.
  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight });
  }, [turns, results]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="hidden h-11 cursor-pointer items-center gap-1.5 rounded-sm px-2.5 text-sm font-semibold text-foreground transition-colors hover:text-secondary md:flex"
          aria-label="Ask the Mirage concierge"
        >
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          <span className="hidden lg:inline">Concierge</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-xl focus:outline-none"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <Dialog.Title className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
              <Sparkles className="h-5 w-5" aria-hidden />
              Mirage Concierge
            </Dialog.Title>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setVoiceReplies((v) => !v)}
                className="rounded-sm p-1.5 text-muted-foreground hover:text-foreground"
                aria-pressed={voiceReplies}
                aria-label={voiceReplies ? "Turn off voice replies" : "Turn on voice replies"}
                title={voiceReplies ? "Voice replies on" : "Voice replies off"}
              >
                {voiceReplies ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-sm p-1.5 text-muted-foreground hover:text-foreground"
                  aria-label="Close concierge"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Active filters */}
          {chips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2">
              {chips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => removeChip(c)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-70",
                    c.tone,
                  )}
                  aria-label={`Remove filter ${c.label}`}
                >
                  {c.label}
                  <X className="h-3 w-3" aria-hidden />
                </button>
              ))}
              <button
                type="button"
                onClick={startOver}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              >
                Start over
              </button>
            </div>
          ) : null}

          {/* Body: transcript + results */}
          <div ref={transcriptRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3" role="log" aria-live="polite">
            {turns.length === 0 && results.length === 0 ? (
              <div className="space-y-3 pt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Tell me what you&apos;re looking for — speak or type.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => send(ex)}
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground hover:border-primary/40"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {turns.map((t, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-sm border px-3 py-2 text-sm",
                  t.role === "user"
                    ? "ml-auto border-primary/20 bg-primary/5 text-foreground"
                    : "border-border bg-muted text-foreground",
                )}
              >
                {t.text}
              </div>
            ))}

            {suggestion ? (
              <div className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                No matches. Want me to drop{" "}
                <button
                  type="button"
                  className="font-semibold underline"
                  onClick={() =>
                    removeChip({
                      id: "sugg",
                      label: suggestion.label,
                      tone: "",
                      facet: suggestion.facet as RemovableChip["facet"],
                      value: suggestion.value,
                    })
                  }
                >
                  {suggestion.label}
                </button>
                ?
              </div>
            ) : null}

            {results.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                {results.slice(0, 8).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : null}

            {results.length > 0 && intent ? (
              <a
                href={`/search?q=${encodeURIComponent(intent.rawQuery)}`}
                className="block py-1 text-center text-sm font-medium text-accent hover:underline"
              >
                See all {results.length} in full search →
              </a>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          {/* Composer */}
          <form
            className="flex items-center gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            {speech.supported ? (
              <button
                type="button"
                onClick={speech.toggle}
                className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border transition-colors",
                  speech.listening
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/40",
                )}
                aria-pressed={speech.listening}
                aria-label={speech.listening ? "Stop listening" : "Speak to the concierge"}
              >
                <Mic className="h-5 w-5" />
              </button>
            ) : null}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={speech.listening ? "Listening…" : "Ask for anything…"}
              className="h-10 min-w-0 flex-1 rounded-sm border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-[#611A33] disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
