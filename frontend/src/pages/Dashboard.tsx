import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Skeleton, Textarea, cn } from '../components/ui';
import {
  acceptInvite,
  createEntry,
  declineInvite,
  deleteDriveFile,
  deleteEntry,
  getDriveSettings,
  getNotes,
  listConnections,
  listDriveFiles,
  listEntries,
  listInvites,
  saveNotes,
  sendInvite,
  setDriveFolder,
  updateEntry,
  type DriveFile,
  type ShareConnection,
  type ShareInvite,
  type VaultEntry,
} from '../lib/api';
import { Modal } from '../components/modal';
import { useToast } from '../components/toast';

function Icon({ name, className }: { name: 'shield' | 'lock' | 'share' | 'drive' | 'note' | 'search' | 'dots' | 'copy' | 'eye' | 'edit' | 'trash' | 'plus'; className?: string }) {
  const common = cn('inline-block', className);
  // Tiny inline icons (no deps)
  switch (name) {
    case 'shield':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'lock':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="1.7" />
          <path d="M6.5 11h11A2.5 2.5 0 0 1 20 13.5v6A2.5 2.5 0 0 1 17.5 22h-11A2.5 2.5 0 0 1 4 19.5v-6A2.5 2.5 0 0 1 6.5 11z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'share':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M16 6a2.5 2.5 0 1 0 0 .01V6zM6 12a2.5 2.5 0 1 0 0 .01V12zM16 18a2.5 2.5 0 1 0 0 .01V18z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8.2 11.2l5.6-3.2M8.2 12.8l5.6 3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'drive':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8 4h8l4 7-4 7H8L4 11 8 4z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 4l4 7h8" stroke="currentColor" strokeWidth="1.7" />
          <path d="M4 11h8l4 7" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'note':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 3h10a2 2 0 0 1 2 2v14l-4-2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 8h8M8 12h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'search':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'dots':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 6.6a1.2 1.2 0 1 0 0 .01V6.6zM12 12a1.2 1.2 0 1 0 0 .01V12zM12 17.4a1.2 1.2 0 1 0 0 .01v-.01z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'copy':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 9h10v12H9V9z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'eye':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'edit':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-.2-.2a2 2 0 0 0-2.8 0L5 17v3z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'trash':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M10 3h4l1 2H9l1-2z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M7 7l1 14h8l1-14" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'plus':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
  }
}

function maskPassword(p: string) {
  return '•'.repeat(Math.min(Math.max(p.length, 8), 14));
}

type Section = 'vault' | 'sharing' | 'drive' | 'notes';

function useOutsideClick(ref: React.RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      handler();
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [ref, handler]);
}

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white/80 backdrop-blur shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-zinc-500">{label}</div>
          <div className="text-2xl font-semibold mt-1">
            {loading ? <Skeleton className="h-7 w-24" /> : value}
          </div>
        </div>
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-50 to-zinc-50 border border-zinc-200/70 flex items-center justify-center text-violet-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
  disabled,
}: {
  icon?: React.ReactNode;
  label: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 text-sm transition',
        'hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed',
        danger && 'text-rose-600 hover:bg-rose-50'
      )}
    >
      {icon ? <span className={cn('text-zinc-500', danger && 'text-rose-600')}>{icon}</span> : null}
      <span>{label}</span>
    </button>
  );
}

function EntryActions({
  entry,
  revealed,
  onRevealToggle,
  onEdit,
  onDelete,
}: {
  entry: VaultEntry;
  revealed: boolean;
  onRevealToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  useOutsideClick(boxRef, () => setOpen(false));
  const { push } = useToast();

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    push(`${label} copiado ✅`, 'success');
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 rounded-xl border border-zinc-200/70 bg-white/90 hover:bg-white text-zinc-700 flex items-center justify-center shadow-sm"
        aria-label="Ações"
      >
        <Icon name="dots" className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-zinc-200 bg-white shadow-soft p-2 z-20">
          <MenuItem
            icon={<Icon name="copy" className="h-4 w-4" />}
            label="Copiar usuário"
            disabled={!entry.username}
            onClick={async () => {
              if (!entry.username) return;
              await copy(entry.username, 'Usuário');
              setOpen(false);
            }}
          />
          <MenuItem
            icon={<Icon name="copy" className="h-4 w-4" />}
            label="Copiar e-mail"
            disabled={!entry.email}
            onClick={async () => {
              if (!entry.email) return;
              await copy(entry.email, 'E-mail');
              setOpen(false);
            }}
          />
          <MenuItem
            icon={<Icon name="copy" className="h-4 w-4" />}
            label="Copiar senha"
            disabled={!entry.password}
            onClick={async () => {
              if (!entry.password) return;
              await copy(entry.password, 'Senha');
              setOpen(false);
            }}
          />
          <MenuItem
            icon={<Icon name="eye" className="h-4 w-4" />}
            label={revealed ? 'Ocultar senha' : 'Revelar senha'}
            disabled={!entry.password}
            onClick={() => {
              onRevealToggle();
              setOpen(false);
            }}
          />

          <div className="h-px bg-zinc-100 my-2" />

          <MenuItem
            icon={<Icon name="edit" className="h-4 w-4" />}
            label="Editar"
            disabled={!entry.canEdit}
            onClick={() => {
              onEdit();
              setOpen(false);
            }}
          />
          <MenuItem
            icon={<Icon name="trash" className="h-4 w-4" />}
            label="Excluir"
            danger
            disabled={!entry.canEdit}
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
          />

          {!entry.canEdit && (
            <div className="mt-2 text-[11px] text-zinc-500 px-1">
              Somente leitura (compartilhado com você)
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function IconActionButton({
  title,
  onClick,
  disabled,
  children,
  danger,
}: {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-9 w-9 rounded-xl border border-zinc-200/70 bg-white/90 shadow-sm flex items-center justify-center transition',
        'hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed',
        danger ? 'text-rose-600 hover:bg-rose-50' : 'text-zinc-700'
      )}
    >
      {children}
    </button>
  );
}

function EntryInlineActions({
  entry,
  revealed,
  onRevealToggle,
  onEdit,
  onDelete,
  compact,
}: {
  entry: VaultEntry;
  revealed: boolean;
  onRevealToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  compact?: boolean;
}) {
  const { push } = useToast();

  async function copyPassword() {
    if (!entry.password) return;
    await navigator.clipboard.writeText(entry.password);
    push('Senha copiada ✅', 'success');
  }

  return (
    <div className={cn('flex items-center gap-2', compact && 'gap-1')}>
      <IconActionButton
        title="Copiar senha"
        disabled={!entry.password}
        onClick={copyPassword}
      >
        <Icon name="copy" className="h-4 w-4" />
      </IconActionButton>

      <IconActionButton
        title={revealed ? 'Ocultar senha' : 'Revelar senha'}
        disabled={!entry.password}
        onClick={onRevealToggle}
      >
        <Icon name="eye" className="h-4 w-4" />
      </IconActionButton>

      <IconActionButton
        title={entry.canEdit ? 'Editar' : 'Somente leitura'}
        disabled={!entry.canEdit}
        onClick={onEdit}
      >
        <Icon name="edit" className="h-4 w-4" />
      </IconActionButton>

      <IconActionButton
        title={entry.canEdit ? 'Excluir' : 'Somente leitura'}
        disabled={!entry.canEdit}
        onClick={onDelete}
        danger
      >
        <Icon name="trash" className="h-4 w-4" />
      </IconActionButton>
    </div>
  );
}


export default function Dashboard({
  userEmail,
  onLogout,
}: {
  userEmail: string;
  onLogout: () => void;
}) {
  const { push } = useToast();

  const [section, setSection] = useState<Section>('vault');

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [query, setQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VaultEntry | null>(null);
  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    ip: '',
    email: '',
    connectionData: '',
    notes: '',
  });

  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Sharing
  const [shareEmail, setShareEmail] = useState('');
  const [sentInvites, setSentInvites] = useState<ShareInvite[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<ShareInvite[]>([]);
  const [connections, setConnections] = useState<ShareConnection[]>([]);

  // Drive
  const [driveFolder, setDriveFolderState] = useState('');
  const [driveOpenUrl, setDriveOpenUrl] = useState<string | null>(null);
  const [driveEnabled, setDriveEnabled] = useState(false);
  const [driveUploadEnabled, setDriveUploadEnabled] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveNeedsSetup, setDriveNeedsSetup] = useState(false);

  // Notes
  const [notes, setNotes] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);
  const [notesUpdatedAt, setNotesUpdatedAt] = useState<string | null>(null);

  async function refreshAll() {
    setLoading(true);
    try {
      const [es, inv, conns, note, driveCfg, driveList] = await Promise.all([
        listEntries(),
        listInvites(),
        listConnections(),
        getNotes(),
        getDriveSettings(),
        listDriveFiles().catch(() => ({ files: [], needsSetup: false } as any)),
      ]);

      setEntries(es);
      setSentInvites(inv.sent ?? []);
      setReceivedInvites(inv.received ?? []);
      setConnections(conns.connections ?? []);
      setNotes(note.notes ?? '');
      setNotesUpdatedAt(note.updatedAt ?? null);

      setDriveEnabled(Boolean(driveCfg.enabled));
      setDriveUploadEnabled(Boolean(driveCfg.uploadEnabled));
      setDriveOpenUrl(driveCfg.openUrl ?? null);
      setDriveNeedsSetup(Boolean((driveList as any).needsSetup));
      setDriveFiles((driveList as any).files ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll().catch(() => push('Falha ao carregar dados', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => {
      const blob = [e.name, e.username, e.email, e.ip, e.ownerEmail].filter(Boolean).join(' ').toLowerCase();
      return blob.includes(q);
    });
  }, [entries, query]);

  const stats = useMemo(() => {
    const total = entries.length;
    const editable = entries.filter((e) => e.canEdit).length;
    const shared = entries.filter((e) => e.isShared).length;
    return { total, editable, shared };
  }, [entries]);

  function openNew() {
    setEditing(null);
    setForm({ name: '', username: '', password: '', ip: '', email: '', connectionData: '', notes: '' });
    setModalOpen(true);
  }

  function openEdit(e: VaultEntry) {
    setEditing(e);
    setForm({
      name: e.name ?? '',
      username: e.username ?? '',
      password: e.password ?? '',
      ip: e.ip ?? '',
      email: e.email ?? '',
      connectionData: e.connectionData ?? '',
      notes: e.notes ?? '',
    });
    setModalOpen(true);
  }

  async function saveEntry() {
    if (!form.name.trim()) {
      push('Informe o nome do serviço', 'error');
      return;
    }

    try {
      if (editing) {
        await updateEntry(editing.id, {
          name: form.name,
          username: form.username || null,
          password: form.password || null,
          ip: form.ip || null,
          email: form.email || null,
          connectionData: form.connectionData || null,
          notes: form.notes || null,
        });
        push('Senha atualizada ✅', 'success');
      } else {
        await createEntry({
          name: form.name,
          username: form.username || null,
          password: form.password || null,
          ip: form.ip || null,
          email: form.email || null,
          connectionData: form.connectionData || null,
          notes: form.notes || null,
          ownerEmail: null,
          ownerUid: undefined,
          canEdit: true,
          isShared: false,
          sharedWith: [],
        } as any);
        push('Senha criada ✅', 'success');
      }
      setModalOpen(false);
      await refreshAll();
    } catch {
      push('Falha ao salvar', 'error');
    }
  }

  async function removeEntry(e: VaultEntry) {
    if (!confirm(`Excluir "${e.name}"?`)) return;
    try {
      await deleteEntry(e.id);
      push('Excluído', 'success');
      await refreshAll();
    } catch {
      push('Falha ao excluir', 'error');
    }
  }

  async function doSendInvite() {
    const email = shareEmail.trim();
    if (!email.includes('@')) return push('Informe um e-mail válido', 'error');
    try {
      await sendInvite(email);
      push('Convite enviado ✅', 'success');
      setShareEmail('');
      await refreshAll();
    } catch {
      push('Falha ao enviar convite', 'error');
    }
  }

  async function doAccept(inviteId: string) {
    try {
      await acceptInvite(inviteId);
      push('Convite aceito ✅', 'success');
      await refreshAll();
    } catch {
      push('Falha ao aceitar', 'error');
    }
  }

  async function doDecline(inviteId: string) {
    try {
      await declineInvite(inviteId);
      push('Convite recusado', 'info');
      await refreshAll();
    } catch {
      push('Falha ao recusar', 'error');
    }
  }

  async function saveDriveFolder() {
    const raw = driveFolder.trim();
    if (!raw) return push('Cole o link/ID da pasta', 'error');
    try {
      await setDriveFolder(raw);
      push('Pasta salva ✅', 'success');
      await refreshAll();
    } catch {
      push('Falha ao salvar pasta', 'error');
    }
  }

  async function removeDriveFile(fileId: string) {
    if (!confirm('Remover arquivo do Drive?')) return;
    try {
      await deleteDriveFile(fileId);
      push('Arquivo removido', 'success');
      await refreshAll();
    } catch {
      push('Falha ao remover', 'error');
    }
  }

  async function saveQuickNotes() {
    try {
      const r = await saveNotes(notes);
      setNotesDirty(false);
      setNotesUpdatedAt(r.updatedAt);
      push('Notas salvas ✅', 'success');
    } catch {
      push('Falha ao salvar notas', 'error');
    }
  }

  const SectionButton = ({
    id,
    label,
    icon,
  }: {
    id: Section;
    label: string;
    icon: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={() => setSection(id)}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition',
      section === id
        ? 'bg-violet-600 text-white shadow-sm'
          : 'text-zinc-700 hover:bg-white/60'
      )}
    >
      <span className={cn('h-5 w-5', section === id ? 'text-white' : 'text-violet-600')}>{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-slate-50 text-zinc-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-72 min-h-screen sticky top-0 p-5">
          <div className="w-full rounded-3xl border border-zinc-200/70 bg-white/70 backdrop-blur shadow-sm p-4 flex flex-col">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 text-white flex items-center justify-center shadow-sm">
                <Icon name="shield" className="h-6 w-6" />
              </div>
              <div>
                <div className="font-semibold leading-tight">SecureVault</div>
                <div className="text-xs text-zinc-500">Cofre de senhas</div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <SectionButton id="vault" label="Minhas Senhas" icon={<Icon name="lock" className="h-5 w-5" />} />
              <SectionButton id="sharing" label="Compartilhamentos" icon={<Icon name="share" className="h-5 w-5" />} />
              <SectionButton id="drive" label="Drive Seguro" icon={<Icon name="drive" className="h-5 w-5" />} />
              <SectionButton id="notes" label="Bloco de Notas" icon={<Icon name="note" className="h-5 w-5" />} />
            </div>

            <div className="mt-auto pt-4">
              <div className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{userEmail}</div>
                  <div className="text-xs text-zinc-500">Conta conectada</div>
                </div>
                <Button variant="secondary" className="px-3 py-2" onClick={onLogout}>
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Topbar */}
          <div className="sticky top-0 z-30">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-5">
              <div className="rounded-3xl border border-zinc-200/70 bg-white/70 backdrop-blur shadow-sm px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="md:hidden h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 text-white flex items-center justify-center">
                    <Icon name="shield" className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Dashboard</div>
                    <div className="text-xs text-zinc-500">Organize e compartilhe com controle</div>
                  </div>
                </div>

                <div className="flex-1 flex items-center gap-3 sm:justify-end">
                  <div className="relative w-full sm:max-w-sm">
                    <Icon name="search" className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar por nome, IP, e-mail…"
                      className="pl-9 bg-white/90"
                    />
                  </div>
                  <Button className="shrink-0" onClick={openNew}>
                    <Icon name="plus" className="h-4 w-4 mr-2" />
                    Nova Senha
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard
                icon={<Icon name="lock" className="h-5 w-5" />}
                label="Total de Senhas"
                value={stats.total}
                loading={loading}
              />
              <StatCard
                icon={<Icon name="edit" className="h-5 w-5" />}
                label="Editáveis"
                value={stats.editable}
                loading={loading}
              />
              <StatCard
                icon={<Icon name="share" className="h-5 w-5" />}
                label="Compartilhadas"
                value={stats.shared}
                loading={loading}
              />
            </div>

            {/* Section switch (mobile) */}
            <div className="md:hidden mt-4 grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSection('vault')}
                className={cn(
                  'rounded-2xl border border-zinc-200/70 bg-white/70 py-2 text-xs font-medium',
                  section === 'vault' && 'bg-violet-600 text-white border-violet-500'
                )}
              >
                Senhas
              </button>
              <button
                type="button"
                onClick={() => setSection('sharing')}
                className={cn(
                  'rounded-2xl border border-zinc-200/70 bg-white/70 py-2 text-xs font-medium',
                  section === 'sharing' && 'bg-violet-600 text-white border-violet-500'
                )}
              >
                Compart.
              </button>
              <button
                type="button"
                onClick={() => setSection('drive')}
                className={cn(
                  'rounded-2xl border border-zinc-200/70 bg-white/70 py-2 text-xs font-medium',
                  section === 'drive' && 'bg-violet-600 text-white border-violet-500'
                )}
              >
                Drive
              </button>
              <button
                type="button"
                onClick={() => setSection('notes')}
                className={cn(
                  'rounded-2xl border border-zinc-200/70 bg-white/70 py-2 text-xs font-medium',
                  section === 'notes' && 'bg-violet-600 text-white border-violet-500'
                )}
              >
                Notas
              </button>
            </div>

            {/* Vault */}
            {section === 'vault' && (
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
                  <div className="hidden lg:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_184px] gap-3 px-5 py-3 border-b border-zinc-200/70 text-[11px] uppercase tracking-wide text-zinc-500">
                    <div>Serviço / Nome</div>
                    <div>Usuário</div>
                    <div>E-mail</div>
                    <div>IP / Host</div>
                    <div>Senha</div>
                    <div className="text-right pr-1">Ações</div>
                  </div>

                  <div>
                    {loading ? (
                      <div className="p-5 space-y-4">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_184px] gap-3 items-center">
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
                          <div
                            key={e.id}
                            className="px-5 py-4 border-b border-zinc-200/50 last:border-b-0"
                          >
                            {/* Card layout (mobile / tablet) */}
                            <div className="lg:hidden">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="font-medium truncate">{e.name}</div>
                                  <div className="text-xs text-zinc-500 mt-1 break-all">
                                    {e.email || e.ip || e.ownerEmail || '—'}
                                  </div>
                                </div>
                                <EntryInlineActions
                                  entry={e}
                                  revealed={revealed}
                                  onRevealToggle={() => setRevealedIds((prev) => ({ ...prev, [e.id]: !prev[e.id] }))}
                                  onEdit={() => openEdit(e)}
                                  onDelete={() => removeEntry(e)}
                                  compact
                                />
                              </div>

                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-2">
                                  <div className="text-[11px] uppercase tracking-wide text-zinc-500">Usuário</div>
                                  <div className="text-sm text-zinc-800 break-all mt-1">{e.username || '—'}</div>
                                </div>

                                <div className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-2">
                                  <div className="text-[11px] uppercase tracking-wide text-zinc-500">E-mail</div>
                                  <div className="text-sm text-zinc-800 break-all mt-1">{e.email || '—'}</div>
                                </div>

                                <div className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-2">
                                  <div className="text-[11px] uppercase tracking-wide text-zinc-500">IP / Host</div>
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
                            <div className="hidden lg:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_184px] gap-3 items-center">
                              <div className="min-w-0">
                                <div className="font-medium truncate">{e.name}</div>
                                <div className="text-xs text-zinc-500 mt-1 truncate">
                                  {e.ownerEmail || '—'}
                                </div>
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
                                  onRevealToggle={() => setRevealedIds((prev) => ({ ...prev, [e.id]: !prev[e.id] }))}
                                  onEdit={() => openEdit(e)}
                                  onDelete={() => removeEntry(e)}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      }))}
                  </div>
                </div>
              </div>
            )}

            {/* Sharing */}
            {section === 'sharing' && (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-3xl border border-zinc-200/70 bg-white/70 backdrop-blur shadow-sm p-5">
                  <div className="flex items-center gap-2">
                    <Icon name="share" className="h-5 w-5 text-violet-600" />
                    <div className="font-semibold">Compartilhar</div>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Convites exigem ação do destinatário (dupla intenção).
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Input value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} placeholder="email@exemplo.com" />
                    <Button onClick={doSendInvite}>Enviar</Button>
                  </div>

                  <div className="mt-5">
                    <div className="text-xs font-semibold text-zinc-600">Conexões ativas</div>
                    <div className="mt-2 space-y-2">
                      {loading ? (
                        <>
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </>
                      ) : connections.length === 0 ? (
                        <div className="text-sm text-zinc-500">Nenhuma conexão ativa.</div>
                      ) : (
                        connections.map((c) => (
                          <div key={c.inviteId} className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-3 flex items-center justify-between">
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{c.email ?? c.uid}</div>
                              <div className="text-xs text-zinc-500">Conectado</div>
                            </div>
                            <div className="text-xs text-zinc-500">OK</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-zinc-200/70 bg-white/70 backdrop-blur shadow-sm p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Convites</div>
                      <div className="text-xs text-zinc-500">Recebidos e enviados.</div>
                    </div>
                    <Button variant="secondary" onClick={refreshAll}>
                      Atualizar
                    </Button>
                  </div>

                  <div className="mt-4">
                    <div className="text-xs font-semibold text-zinc-600">Recebidos</div>
                    <div className="mt-2 space-y-2">
                      {loading ? (
                        <Skeleton className="h-12 w-full" />
                      ) : receivedInvites.filter((i) => i.status === 'pending').length === 0 ? (
                        <div className="text-sm text-zinc-500">Nenhum convite pendente.</div>
                      ) : (
                        receivedInvites
                          .filter((i) => i.status === 'pending')
                          .map((i) => (
                            <div key={i.id} className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-3 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">De: {i.fromEmail ?? i.fromUid}</div>
                                <div className="text-xs text-zinc-500">Pendente</div>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => doAccept(i.id)}>Aceitar</Button>
                                <Button variant="secondary" onClick={() => doDecline(i.id)}>
                                  Recusar
                                </Button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="text-xs font-semibold text-zinc-600">Enviados</div>
                    <div className="mt-2 space-y-2">
                      {loading ? (
                        <Skeleton className="h-12 w-full" />
                      ) : sentInvites.length === 0 ? (
                        <div className="text-sm text-zinc-500">Nenhum convite enviado.</div>
                      ) : (
                        sentInvites.slice(0, 5).map((i) => (
                          <div key={i.id} className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-3 flex items-center justify-between">
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">Para: {i.toEmail ?? i.toUid ?? '—'}</div>
                              <div className="text-xs text-zinc-500">{i.status}</div>
                            </div>
                            <div className="text-xs text-zinc-500">#{i.id.slice(0, 6)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Drive */}
            {section === 'drive' && (
              <div className="mt-6 rounded-3xl border border-zinc-200/70 bg-white/70 backdrop-blur shadow-sm p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Icon name="drive" className="h-5 w-5 text-violet-600" />
                    <div>
                      <div className="font-semibold">Drive (Emergencial)</div>
                      <div className="text-xs text-zinc-500">Armazenamento temporário vinculado à sua pasta.</div>
                    </div>
                  </div>
                  {driveOpenUrl && (
                    <a
                      href={driveOpenUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-violet-700 hover:text-violet-800 font-medium"
                    >
                      Abrir pasta
                    </a>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                  <Input value={driveFolder} onChange={(e) => setDriveFolderState(e.target.value)} placeholder="ID da pasta ou Link" />
                  <Button onClick={saveDriveFolder}>Salvar</Button>
                </div>

                {!driveEnabled && (
                  <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl p-3">
                    Drive não está habilitado no servidor. Configure <b>GOOGLE_DRIVE_API_KEY</b>.
                  </div>
                )}

                <div className="mt-5">
                  <div className="text-xs font-semibold text-zinc-600">Arquivos na pasta</div>
                  <div className="mt-2 rounded-2xl border border-zinc-200/70 bg-white overflow-hidden">
                    {loading ? (
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : driveNeedsSetup ? (
                      <div className="p-4 text-sm text-zinc-500">Defina uma pasta para começar.</div>
                    ) : driveFiles.length === 0 ? (
                      <div className="p-4 text-sm text-zinc-500">Nenhum arquivo encontrado com o prefixo do Vault.</div>
                    ) : (
                      <div className="divide-y divide-zinc-100">
                        {driveFiles.slice(0, 30).map((f) => (
                          <div key={f.id} className="px-4 py-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{f.name}</div>
                              <div className="text-xs text-zinc-500">{f.modifiedTime ? new Date(f.modifiedTime).toLocaleString() : ''}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              {f.webViewLink && (
                                <a href={f.webViewLink} target="_blank" rel="noreferrer" className="text-sm text-violet-700 hover:text-violet-800">
                                  Ver
                                </a>
                              )}
                              {driveUploadEnabled && (
                                <Button variant="secondary" onClick={() => removeDriveFile(f.id)}>
                                  Remover
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {!driveUploadEnabled && (
                    <div className="mt-3 text-xs text-zinc-500">
                      No modo <b>link público</b>, upload/remoção via app não está disponível. Use <b>Abrir pasta</b>.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {section === 'notes' && (
              <div className="mt-6 rounded-3xl border border-zinc-200/70 bg-white/70 backdrop-blur shadow-sm p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Icon name="note" className="h-5 w-5 text-violet-600" />
                    <div>
                      <div className="font-semibold">Rascunho Rápido</div>
                      <div className="text-xs text-zinc-500">
                        Bloco de notas provisório. {notesUpdatedAt ? `Última atualização: ${new Date(notesUpdatedAt).toLocaleString()}` : ''}
                      </div>
                    </div>
                  </div>
                  <Button onClick={saveQuickNotes} disabled={loading || !notesDirty}>
                    Salvar
                  </Button>
                </div>

                <div className="mt-4">
                  {loading ? (
                    <Skeleton className="h-44 w-full" />
                  ) : (
                    <Textarea
                      value={notes}
                      onChange={(e) => {
                        setNotes(e.target.value);
                        setNotesDirty(true);
                      }}
                      rows={10}
                      placeholder="Escreva lembretes rápidos aqui..."
                      className="bg-white/90"
                    />
                  )}
                  <div className="mt-2 text-[11px] text-zinc-500">
                    {notesDirty ? 'Não salvo ainda.' : 'Salvo.'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal create/edit */}
      <Modal
        open={modalOpen}
        title={editing ? 'Editar senha' : 'Nova senha'}
        onClose={() => setModalOpen(false)}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600">Serviço / Nome</label>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ex.: AWS Console" />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Usuário</label>
            <Input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} placeholder="Ex.: root" />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Senha</label>
            <Input value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">IP / Host</label>
            <Input value={form.ip} onChange={(e) => setForm((p) => ({ ...p, ip: e.target.value }))} placeholder="Ex.: 10.0.0.10" />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">E-mail vinculado</label>
            <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Ex.: admin@empresa.com" />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600">Dados de conexão</label>
            <Textarea
              value={form.connectionData}
              onChange={(e) => setForm((p) => ({ ...p, connectionData: e.target.value }))}
              rows={3}
              placeholder="Portas, URLs, observações..."
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600">Notas</label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
              placeholder="Observações internas..."
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={saveEntry}>{editing ? 'Salvar alterações' : 'Criar senha'}</Button>
        </div>
      </Modal>
    </div>
  );
}
