import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { cn } from './ui';

type Toast = { id: string; message: string; kind?: 'info' | 'error' | 'success' };

const ToastCtx = createContext<{ push: (message: string, kind?: Toast['kind']) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider />');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, kind: Toast['kind'] = 'info') => {
    const id = crypto.randomUUID();
    const t: Toast = { id, message, kind };
    setToasts((prev) => [t, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'rounded-xl border px-4 py-3 text-sm shadow-soft bg-white',
              t.kind === 'error' && 'border-rose-200',
              t.kind === 'success' && 'border-emerald-200',
              t.kind === 'info' && 'border-zinc-200'
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
