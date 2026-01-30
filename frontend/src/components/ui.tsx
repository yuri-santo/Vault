import React from 'react';

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  const { className, variant = 'primary', ...rest } = props;
  const base = 'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/40 disabled:opacity-60 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-800',
    secondary: 'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-500'
  } as const;
  return <button className={cn(base, variants[variant], className)} {...rest} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400/30',
        className
      )}
      {...rest}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400/30',
        className
      )}
      {...rest}
    />
  );
}

export function Card({ title, subtitle, children }: { title?: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white shadow-soft border border-zinc-100">
      {(title || subtitle) && (
        <div className="px-6 py-5 border-b border-zinc-100">
          {title && <div className="text-base font-semibold">{title}</div>}
          {subtitle && <div className="text-sm text-zinc-500 mt-1">{subtitle}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
