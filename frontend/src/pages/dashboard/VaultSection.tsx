import React from 'react';
import { Skeleton, cn } from '../../components/ui';
import type { VaultEntry } from '../../lib/api';
import { Icon } from './Icons';

type EntryInlineActionsProps = {
  entry: VaultEntry;
  revealed: boolean;
  onRevealToggle: () => void;
  onView: () => void;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
  compact?: boolean;
};

export default function VaultSection({
  loading,
  filtered,
  alphaFilter,
  setAlphaFilter,
  revealedIds,
  setRevealedIds,
  maskPassword,
  openView,
  openShare,
  openEdit,
  removeEntry,
  EntryInlineActions,
}: {
  loading: boolean;
  filtered: VaultEntry[];
  alphaFilter: string;
  setAlphaFilter: (v: string) => void;
  revealedIds: Record<string, boolean>;
  setRevealedIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  maskPassword: (p: string) => string;
  openView: (e: VaultEntry) => void;
  openShare: (e: VaultEntry) => void;
  openEdit: (e: VaultEntry) => void;
  removeEntry: (e: VaultEntry) => void;
  EntryInlineActions: React.ComponentType<EntryInlineActionsProps>;
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="lock" className="h-5 w-5 text-violet-600" />
          <div className="text-lg font-semibold">Cofre Principal</div>
        </div>
        <div className="text-xs text-zinc-500 rounded-xl border border-zinc-200/70 bg-white/70 px-3 py-1.5">
          {loading ? '…' : `${filtered.length} entradas`}
        </div>
      </div>

      <div className="mt-3 rounded-3xl border border-zinc-200/70 bg-white/70 backdrop-blur shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-200/70 bg-white/50">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-wrap gap-1">
              {['', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')].map((L) => (
                <button
                  key={L || 'all'}
                  type="button"
                  onClick={() => setAlphaFilter(L)}
                  className={cn(
                    'h-7 min-w-7 px-2 rounded-lg border text-[11px] font-medium transition',
                    alphaFilter === L
                      ? 'bg-violet-600 text-white border-violet-500'
                      : 'bg-white/90 border-zinc-200/70 text-zinc-600 hover:bg-zinc-50'
                  )}
                  title={L ? `Filtrar por ${L}` : 'Todas'}
                >
                  {L || 'Tudo'}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-zinc-500">
              {alphaFilter ? `Filtro: ${alphaFilter}` : 'Sem filtro por letra'}
            </div>
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_260px] gap-3 px-5 py-3 border-b border-zinc-200/70 text-[11px] uppercase tracking-wide text-zinc-500">
          <div>Serviço {'/'} Nome</div>
          <div>Usuário</div>
          <div>E-mail</div>
          <div>IP {'/'} Host</div>
          <div>Senha</div>
          <div className="text-right pr-1">Ações</div>
        </div>

        <div>
          {loading ? (
            <div className="p-5 space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_260px] gap-3 items-center"
                >
                  <div>
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24 mt-2" />
                  </div>
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-9 w-44" />
                  <div className="flex lg:justify-end">
                    <Skeleton className="h-9 w-40 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-sm text-zinc-500">
              Nenhuma senha encontrada. Clique em <b>Nova Senha</b> para adicionar.
            </div>
          ) : (
            filtered.map((e) => {
              const revealed = Boolean(revealedIds[e.id]);
              const pass = e.password ?? '';
              return (
                <div key={e.id} className="px-5 py-4 border-b border-zinc-200/50 last:border-b-0">
                  {/* Card layout (mobile / tablet) */}
                  <div className="lg:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{e.name}</div>
                        <div className="text-xs text-zinc-500 mt-1 break-all">
                          {e.isShared
                            ? `Compartilhado por ${e.ownerEmail || '—'}`
                            : e.email || e.ip || e.ownerEmail || '—'}
                        </div>
                        {e.url ? (
                          <a
                            href={(e.url.startsWith('http') ? e.url : `https://${e.url}`) as any}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-violet-700 hover:underline break-all"
                            title="Abrir URL"
                          >
                            <Icon name="externalLink" className="h-3.5 w-3.5" />
                            <span>{e.url}</span>
                          </a>
                        ) : null}
                      </div>
                      <EntryInlineActions
                        entry={e}
                        revealed={revealed}
                        onRevealToggle={() =>
                          setRevealedIds((prev) => ({ ...prev, [e.id]: !prev[e.id] }))
                        }
                        onView={() => openView(e)}
                        onShare={() => openShare(e)}
                        onEdit={() => openEdit(e)}
                        onDelete={() => removeEntry(e)}
                        compact
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-2">
                        <div className="text-[11px] uppercase tracking-wide text-zinc-500">Usuário</div>
                        <div className="text-sm text-zinc-800 break-all mt-1">
                          {e.username || '—'}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-2">
                        <div className="text-[11px] uppercase tracking-wide text-zinc-500">E-mail</div>
                        <div className="text-sm text-zinc-800 break-all mt-1">{e.email || '—'}</div>
                      </div>

                      <div className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-2">
                        <div className="text-[11px] uppercase tracking-wide text-zinc-500">IP {'/'} Host</div>
                        <div className="text-sm text-zinc-800 break-all mt-1">{e.ip || '—'}</div>
                      </div>

                      <div className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-2">
                        <div className="text-[11px] uppercase tracking-wide text-zinc-500">Senha</div>
                        <div className="text-sm font-mono text-zinc-800 mt-1 break-all">
                          {pass ? (revealed ? pass : maskPassword(pass)) : '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table row layout (desktop) */}
                  <div className="hidden lg:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_260px] gap-3 items-center">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{e.name}</div>
                      <div className="text-xs text-zinc-500 mt-1 truncate">
                        {e.isShared
                          ? `Compartilhado por ${e.ownerEmail || '—'}`
                          : e.ownerEmail || '—'}
                      </div>
                      {e.url ? (
                        <a
                          href={(e.url.startsWith('http') ? e.url : `https://${e.url}`) as any}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-violet-700 hover:underline truncate"
                          title="Abrir URL"
                        >
                          <Icon name="externalLink" className="h-3.5 w-3.5" />
                          <span className="truncate">{e.url}</span>
                        </a>
                      ) : null}
                    </div>

                    <div className="text-sm text-zinc-800 break-all">{e.username || '—'}</div>
                    <div className="text-sm text-zinc-800 break-all">{e.email || '—'}</div>
                    <div className="text-sm text-zinc-800 break-all">{e.ip || '—'}</div>

                    <div className="flex items-center">
                      <div className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 w-full">
                        <span className="text-sm font-mono text-zinc-800">
                          {pass ? (revealed ? pass : maskPassword(pass)) : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <EntryInlineActions
                        entry={e}
                        revealed={revealed}
                        onRevealToggle={() =>
                          setRevealedIds((prev) => ({ ...prev, [e.id]: !prev[e.id] }))
                        }
                        onView={() => openView(e)}
                        onShare={() => openShare(e)}
                        onEdit={() => openEdit(e)}
                        onDelete={() => removeEntry(e)}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
