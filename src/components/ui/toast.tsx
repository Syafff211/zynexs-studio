"use client";

import * as React from "react";
import { useMounted } from "@/hooks/use-mounted";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (input: { title: string; description?: string; variant?: ToastVariant }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />,
  error: <AlertCircle className="h-5 w-5 text-rose-400" aria-hidden="true" />,
  info: <Info className="h-5 w-5 text-brand-300" aria-hidden="true" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />,
};

const accents: Record<ToastVariant, string> = {
  success: "before:bg-emerald-400",
  error: "before:bg-rose-400",
  info: "before:bg-brand-400",
  warning: "before:bg-amber-400",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const mounted = useMounted();

  const remove = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback<ToastContextValue["toast"]>(
    ({ title, description, variant = "info" }) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev.slice(-3), { id, title, description, variant }]);
      setTimeout(() => remove(id), 5200);
    },
    [remove]
  );

  const value = React.useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) => toast({ title, description, variant: "success" }),
      error: (title, description) => toast({ title, description, variant: "error" }),
      info: (title, description) => toast({ title, description, variant: "info" }),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div
            role="region"
            aria-live="polite"
            aria-label="Notifikasi"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2.5 p-4 sm:inset-x-auto sm:right-0 sm:top-0 sm:items-end sm:p-5"
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "glass-strong pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-2xl px-4 py-3.5 shadow-2xl",
                  "animate-fade-up before:absolute before:inset-y-0 before:left-0 before:w-1",
                  accents[t.variant]
                )}
              >
                <span className="mt-0.5 shrink-0">{icons[t.variant]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 text-[13px] leading-relaxed text-white/60">
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  aria-label="Tutup notifikasi"
                  className="-mr-1 shrink-0 rounded-lg p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
