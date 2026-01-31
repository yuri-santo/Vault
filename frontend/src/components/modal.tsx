import React, { useEffect } from 'react';
import { cn } from './ui';

export function Modal({
  open,
  title,
  children,
  onClose,
  size = 'md',
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  size?: 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass =
    size === 'xl'
      ? 'max-w-4xl'
      : size === 'lg'
      ? 'max-w-3xl'
      : 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-3 sm:p-4">
        <div
          className={cn(
            'w-full rounded-2xl bg-white shadow-soft border border-zinc-100 overflow-hidden',
            'animate-[pop_.14s_ease-out]',
            'flex flex-col',
            sizeClass,
            'max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2rem)]'
          )}
        >
          <div className="px-5 sm:px-6 py-4 border-b border-zinc-100 flex items-center justify-between gap-3">
            <div className="font-semibold truncate">{title}</div>
            <button
              className="text-zinc-500 hover:text-zinc-900"
              onClick={onClose}
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto">{children}</div>
        </div>
      </div>

      <style>{`@keyframes pop { from { transform: translateY(8px); opacity: 0.8 } to { transform: translateY(0); opacity: 1 } }`}</style>
    </div>
  );
}
