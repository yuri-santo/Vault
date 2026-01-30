import React from 'react';
import { cn } from './ui';

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-4">
        <div className={cn(
          'w-full max-w-2xl rounded-2xl bg-white shadow-soft border border-zinc-100 overflow-hidden',
          'animate-[pop_.14s_ease-out]'
        )}>
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div className="font-semibold">{title}</div>
            <button className="text-zinc-500 hover:text-zinc-900" onClick={onClose} aria-label="Fechar">✕</button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
      <style>{`@keyframes pop { from { transform: translateY(8px); opacity: 0.8 } to { transform: translateY(0); opacity: 1 } }`}</style>
    </div>
  );
}
