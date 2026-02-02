import React, { useMemo } from 'react';
import { Button, Input, Skeleton, Textarea, cn } from '../../components/ui';
import type { NoteItem } from '../../lib/api';
import { Icon } from './Icons';

type Props = {
  loading: boolean;

  // quick notes
  notes: string;
  notesDirty: boolean;
  notesUpdatedAt: string | null;
  onNotesChange: (v: string) => void;
  onSaveQuickNotes: () => void | Promise<void>;

  // note cards
  noteItems: NoteItem[];
  noteQuery: string;
  setNoteQuery: (v: string) => void;
  onClearQuery: () => void;
  onNewNote: () => void;
  onEditNote: (n: NoteItem) => void;
  onDeleteNote: (n: NoteItem) => void;
  onCopyContent: (content: string) => void;
};

function ActionBtn({
  title,
  onClick,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        'h-9 w-9 rounded-xl border border-zinc-200/70 bg-white/90 shadow-sm flex items-center justify-center transition',
        'hover:bg-zinc-50',
        danger ? 'text-rose-600 hover:bg-rose-50' : 'text-zinc-700'
      )}
    >
      {children}
    </button>
  );
}

export default function NotesSection(props: Props) {
  const {
    loading,
    notes,
    notesDirty,
    notesUpdatedAt,
    onNotesChange,
    onSaveQuickNotes,
    noteItems,
    noteQuery,
    setNoteQuery,
    onClearQuery,
    onNewNote,
    onEditNote,
    onDeleteNote,
    onCopyContent,
  } = props;

  const filtered = useMemo(() => {
    // Defensive: avoid runtime errors if noteQuery ever becomes undefined/null
    const q = (noteQuery ?? '').trim().toLowerCase();
    return noteItems
      .filter((n) => {
        if (!q) return true;
        return (n.title ?? '').toLowerCase().includes(q) || (n.content ?? '').toLowerCase().includes(q);
      })
      .sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt));
  }, [noteItems, noteQuery]);

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-3xl border border-zinc-200/70 bg-white/70 backdrop-blur shadow-sm p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Icon name="note" className="h-5 w-5 text-violet-600" />
            <div>
              <div className="font-semibold">Rascunho Rápido</div>
              <div className="text-xs text-zinc-500">
                Bloco de notas provisório.{' '}
                {notesUpdatedAt ? `Última atualização: ${new Date(notesUpdatedAt).toLocaleString()}` : ''}
              </div>
            </div>
          </div>
          <Button onClick={onSaveQuickNotes} disabled={loading || !notesDirty}>
            Salvar
          </Button>
        </div>

        <div className="mt-4">
          {loading ? (
            <Skeleton className="h-44 w-full" />
          ) : (
            <Textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={10}
              placeholder="Escreva lembretes rápidos aqui..."
              className="bg-white/90"
            />
          )}
          <div className="mt-2 text-[11px] text-zinc-500">{notesDirty ? 'Não salvo ainda.' : 'Salvo.'}</div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200/70 bg-white/70 backdrop-blur shadow-sm p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="font-semibold">Notas (cards)</div>
            <div className="text-xs text-zinc-500">
              Crie notas nomeadas com data, busque pelo nome ou conteúdo e use como referência de projeto.
            </div>
          </div>
          <Button onClick={onNewNote}>Nova nota</Button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Icon name="search" className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={noteQuery} onChange={(e) => setNoteQuery(e.target.value)} placeholder="Buscar nota..." className="pl-9 bg-white/90" />
          </div>
          <Button variant="secondary" onClick={onClearQuery}>
            Limpar
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((n) => (
            <div key={n.id} className="rounded-2xl border border-zinc-200/70 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm">{n.title}</div>
                  <div className="text-[11px] text-zinc-500">{new Date(n.updatedAt ?? n.createdAt).toLocaleString()}</div>
                </div>

                <div className="flex gap-1">
                  <ActionBtn title="Copiar conteúdo" onClick={() => onCopyContent(n.content)}>
                    <Icon name="copy" className="h-4 w-4" />
                  </ActionBtn>
                  <ActionBtn title="Editar" onClick={() => onEditNote(n)}>
                    <Icon name="edit" className="h-4 w-4" />
                  </ActionBtn>
                  <ActionBtn title="Excluir" onClick={() => onDeleteNote(n)} danger>
                    <Icon name="trash" className="h-4 w-4" />
                  </ActionBtn>
                </div>
              </div>

              <div className="mt-3 text-sm text-zinc-700 whitespace-pre-wrap line-clamp-5">{n.content}</div>
            </div>
          ))}

          {noteItems.length === 0 && <div className="text-sm text-zinc-500">Nenhuma nota criada ainda.</div>}
        </div>
      </div>
    </div>
  );
}
