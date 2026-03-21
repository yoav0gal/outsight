"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FeedbackVariant = "success" | "error";

type FeedbackItem = {
  id: number;
  title: string;
  description?: string;
  variant: FeedbackVariant;
};

type FeedbackInput = Omit<FeedbackItem, "id">;

type FeedbackContextValue = {
  showFeedback: (input: FeedbackInput) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const FEEDBACK_LIFETIME_MS = 4000;

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const nextId = useRef(1);
  const timeouts = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    const timeoutId = timeouts.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeouts.current.delete(id);
    }

    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }, []);

  const showFeedback = useCallback(
    (input: FeedbackInput) => {
      const id = nextId.current++;
      setItems((currentItems) => [...currentItems, { id, ...input }]);

      const timeoutId = window.setTimeout(() => dismiss(id), FEEDBACK_LIFETIME_MS);
      timeouts.current.set(id, timeoutId);
    },
    [dismiss]
  );

  useEffect(() => {
    const timeoutMap = timeouts.current;

    return () => {
      for (const timeoutId of timeoutMap.values()) {
        window.clearTimeout(timeoutId);
      }
      timeoutMap.clear();
    };
  }, []);

  const value = useMemo(() => ({ showFeedback }), [showFeedback]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 top-4 z-[120] flex flex-col gap-3 sm:start-auto sm:end-4 sm:w-[min(24rem,calc(100vw-2rem))]">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto overflow-hidden rounded-[1.5rem] border bg-white shadow-lg ring-1 ring-black/5 transition-all animate-in slide-in-from-top-2 fade-in-0",
              item.variant === "success"
                ? "border-emerald-100"
                : "border-red-100"
            )}
          >
            <div className="flex items-start gap-3 p-4">
              <div
                className={cn(
                  "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
                  item.variant === "success"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                )}
              >
                {item.variant === "success" ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <CircleAlert className="size-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-950">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-sm leading-6 text-zinc-600">{item.description}</p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-zinc-500 hover:text-zinc-800"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss feedback"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }

  return context;
}
