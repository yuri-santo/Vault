import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Skeleton, Textarea, cn } from '../components/ui';
import {
  acceptInvite,
  createEntry,
  declineInvite,
  browseDrive,
  createProject,
  deleteDriveFile,
  deleteEntry,
  deleteProject,
  getDriveSettings,
  getNotes,
  listNoteItems,
  createNoteItem,
  updateNoteItem,
  deleteNoteItem,
  getProjectBoard,
  listConnections,
  listDriveFiles,
  listEntries,
  listInvites,
  listProjects,
  saveNotes,
  saveProjectBoard,
  shareProject,
  sendInvite,
  setDriveFolder,
  updateEntry,
  updateEntryShare,
  updateProject,
  type DriveFile,
  type DriveItem,
  type Project,
  type ProjectBoard,
  type ShareConnection,
  type ShareInvite,
  type VaultEntry,
  type NoteItem,
} from '../lib/api';
import { copyText } from '../lib/clipboard';
import { Modal } from '../components/modal';
import { useToast } from '../components/toast';
import { Icon } from './dashboard/Icons';
import DriveSection from './dashboard/DriveSection';
import NotesSection from './dashboard/NotesSection';
import ProjectsSection from './dashboard/ProjectsSection';
import VaultSection from './dashboard/VaultSection';
import SharingSection from './dashboard/SharingSection';
import EntryEditModal from './dashboard/modals/EntryEditModal';


function maskPassword(p: string) {
  return '•'.repeat(Math.min(Math.max(p.length, 8), 14));
}

// Deterministic small rotation for a "post-it" look.
// We keep this function outside the component to avoid TDZ/hoisting issues.
function postitAngle(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  // Map hash to a small angle between -2.6 and +2.6 degrees
  const n = Math.abs(h % 1000) / 1000; // 0..1
  const angle = (n * 5.2) - 2.6;
  // Reduce micro jitter
  return Math.round(angle * 10) / 10;
}

type Section = 'vault' | 'sharing' | 'drive' | 'projects' | 'notes';

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
  onView,
  onEdit,
  onDelete,
}: {
  entry: VaultEntry;
  revealed: boolean;
  onRevealToggle: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  useOutsideClick(boxRef, () => setOpen(false));
  const { push } = useToast();
  const doCopy = useCallback(async (text: string, label: string) => {
    try {
      await copyText(text ?? '');
      push(`${label} copiado ✅`, 'success');
    } catch {
      push('Não foi possível copiar', 'error');
    }
  }, [push]);
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
            icon={<Icon name="info" className="h-4 w-4" />}
            label="Ver detalhes"
            onClick={() => {
              onView();
              setOpen(false);
            }}
          />

          <MenuItem
            icon={<Icon name="copy" className="h-4 w-4" />}
            label="Copiar usuário"
            disabled={!entry.username}
            onClick={async () => {
              if (!entry.username) return;
              await doCopy(entry.username, 'Usuário');
              setOpen(false);
            }}
          />
          <MenuItem
            icon={<Icon name="copy" className="h-4 w-4" />}
            label="Copiar e-mail"
            disabled={!entry.email}
            onClick={async () => {
              if (!entry.email) return;
              await doCopy(entry.email, 'E-mail');
              setOpen(false);
            }}
          />
          <MenuItem
            icon={<Icon name="copy" className="h-4 w-4" />}
            label="Copiar senha"
            disabled={!entry.password}
            onClick={async () => {
              if (!entry.password) return;
              await doCopy(entry.password, 'Senha');
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
  onView,
  onShare,
  onEdit,
  onDelete,
  compact,
}: {
  entry: VaultEntry;
  revealed: boolean;
  onRevealToggle: () => void;
  onView: () => void;
  onShare: () => void;
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
        title="Ver detalhes"
        onClick={onView}
      >
        <Icon name="info" className="h-4 w-4" />
      </IconActionButton>

      <IconActionButton
        title={entry.canEdit ? 'Compartilhar' : 'Somente leitura'}
        disabled={!entry.canEdit}
        onClick={onShare}
      >
        <Icon name="share" className={cn('h-4 w-4', entry.sharedWith?.length ? 'text-violet-700' : '')} />
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
  const copyToClipboard = useCallback(async (text: string, label?: string) => {
    try {
      await copyText(text ?? '');
      push(label ? `${label} copiado ✅` : 'Copiado ✅', 'success');
    } catch {
      push('Não foi possível copiar', 'error');
    }
  }, [push]);


  const [section, setSection] = useState<Section>('vault');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [query, setQuery] = useState('');
  const [alphaFilter, setAlphaFilter] = useState('');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [advFilters, setAdvFilters] = useState({
    scope: 'all' as 'all' | 'mine' | 'shared',
    ownerEmail: '',
    hasSap: false,
    hasVpn: false,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VaultEntry | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<VaultEntry | null>(null);
  const [viewReveal, setViewReveal] = useState(false);
  const [form, setForm] = useState({
    entryType: 'generic',
    name: '',
    url: '',
    username: '',
    password: '',
    ip: '',
    email: '',
    connectionData: '',
    sapConnection: '',
    vpnConnection: '',
    notes: '',
  });

  type SapConn = {
    applicationServer: string;
    instanceNumber: string;
    systemId: string;
    client: string;
    language: string;
    sapRouter: string;
    messageServer: string;
    logonGroup: string;
    sncName: string;
  };
  type VpnConn = {
    provider: string;
    server: string;
    port: string;
    protocol: string;
    username: string;
    domain: string;
    profile: string;
    notes: string;
  };

  const emptySap: SapConn = {
    applicationServer: '',
    instanceNumber: '',
    systemId: '',
    client: '',
    language: 'PT',
    sapRouter: '',
    messageServer: '',
    logonGroup: '',
    sncName: '',
  };
  const emptyVpn: VpnConn = {
    provider: '',
    server: '',
    port: '',
    protocol: '',
    username: '',
    domain: '',
    profile: '',
    notes: '',
  };

  const [sapConn, setSapConn] = useState<SapConn>(emptySap);
  const [vpnConn, setVpnConn] = useState<VpnConn>(emptyVpn);
  const [metaJsonText, setMetaJsonText] = useState('');

  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Sharing
  const [shareEmail, setShareEmail] = useState('');
  const [sentInvites, setSentInvites] = useState<ShareInvite[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<ShareInvite[]>([]);
  const [connections, setConnections] = useState<ShareConnection[]>([]);

  // Compartilhar senha (por entrada)
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareEntry, setShareEntry] = useState<VaultEntry | null>(null);
  const [shareSelectedUids, setShareSelectedUids] = useState<Record<string, boolean>>({});
  const [shareExtraEmails, setShareExtraEmails] = useState('');

  // Drive
  const [driveFolder, setDriveFolderState] = useState('');
  const [driveOpenUrl, setDriveOpenUrl] = useState<string | null>(null);
  const [driveEnabled, setDriveEnabled] = useState(false);
  const [driveUploadEnabled, setDriveUploadEnabled] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveNeedsSetup, setDriveNeedsSetup] = useState(false);

  // Drive Explorer
  const [drivePath, setDrivePath] = useState<{ id: string; name: string }[]>([]);
  const [driveItems, setDriveItems] = useState<DriveItem[]>([]);
  const [driveExplorerLoading, setDriveExplorerLoading] = useState(false);

  // Projects / Kanban
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectBoard, setProjectBoard] = useState<ProjectBoard | null>(null);
  const [projectBoardLoading, setProjectBoardLoading] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [cardEdit, setCardEdit] = useState({
    title: '',
    description: '',
    type: ('general' as any),
    estimateHours: '',
    priority: 'med',
    dueDate: '',
    checklistText: '',
    color: 'yellow',
    qaNotes: '',
    prodNotes: '',
    tags: '',
    approved: false,
    columnId: '',
  });
  const [newCardComment, setNewCardComment] = useState('');
  const [newCardEmailSubject, setNewCardEmailSubject] = useState('');
  const [newCardEmailBody, setNewCardEmailBody] = useState('');
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectType, setNewProjectType] = useState<'sap' | 'general'>('sap');
  const [newProjectHourlyRate, setNewProjectHourlyRate] = useState('');

  // Project sharing (owner-only)
  const [projectShareModalOpen, setProjectShareModalOpen] = useState(false);
  const [projectShareTarget, setProjectShareTarget] = useState<Project | null>(null);
  const [projectShareEmails, setProjectShareEmails] = useState('');
  const [projectShareSelectedUids, setProjectShareSelectedUids] = useState<string[]>([]);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDesc, setNewCardDesc] = useState('');
  const [newCardColumnId, setNewCardColumnId] = useState('');
  const [newCardColor, setNewCardColor] = useState<'yellow' | 'blue' | 'green' | 'pink' | 'white'>('yellow');
  const [newCardType, setNewCardType] = useState<'task' | 'note'>('task');

  // Kanban (UI)
  const boardWrapRef = useRef<HTMLDivElement | null>(null);
  const [boardZoom, setBoardZoom] = useState(1);

  const [boardFullscreen, setBoardFullscreen] = useState(false);
  const [projectSummaryModal, setProjectSummaryModal] = useState<
    'approved' | 'finalized' | null
  >(null);

  function clampNum(v: number, min: number, max: number) {
    return Math.min(max, Math.max(min, v));
  }

  function handleBoardWheel(e: React.WheelEvent) {
    // Zoom with mouse wheel (Ctrl/Cmd or Alt). Keeps normal scrolling when not zooming.
    if (!(e.ctrlKey || e.metaKey || e.altKey)) return;
    e.preventDefault();
    const dir = e.deltaY > 0 ? -1 : 1;
    setBoardZoom((z) => clampNum(Number((z + dir * 0.06).toFixed(2)), 0.55, 1.85));
  }
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);

  // Notes
  const [notes, setNotes] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);
  const [notesUpdatedAt, setNotesUpdatedAt] = useState<string | null>(null);
  const [noteItems, setNoteItems] = useState<NoteItem[]>([]);
  const [noteQuery, setNoteQuery] = useState('');
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });

  async function refreshAll() {
    setLoading(true);
    try {
      const [es, inv, conns, note, noteItemsRes, driveCfg, driveList, projs] = await Promise.all([
        listEntries(),
        listInvites(),
        listConnections(),
        getNotes(),
        listNoteItems().catch(() => ({ items: [] } as any)),
        getDriveSettings(),
        listDriveFiles().catch(() => ({ files: [], needsSetup: false } as any)),
        listProjects().catch(() => ({ projects: [] } as any)),
      ]);

      setEntries(es);
      setSentInvites(inv.sent ?? []);
      setReceivedInvites(inv.received ?? []);
      setConnections(conns.connections ?? []);
      setNotes(note.notes ?? '');
      setNotesUpdatedAt(note.updatedAt ?? null);
      setNoteItems((noteItemsRes as any).items ?? []);
      setNoteItems((noteItemsRes as any).items ?? []);

      setDriveEnabled(Boolean(driveCfg.enabled));
      setDriveUploadEnabled(Boolean(driveCfg.uploadEnabled));
      setDriveOpenUrl(driveCfg.openUrl ?? null);
      // Keep the saved Drive folder link/ID visible in the input
      setDriveFolderState((driveCfg.openUrl ?? driveCfg.folderId ?? '') as any);
      setDriveNeedsSetup(Boolean((driveList as any).needsSetup));
      setDriveFiles((driveList as any).files ?? []);

      const pList = (projs as any).projects ?? [];
      setProjects(pList);
      if (!activeProjectId && pList.length > 0) setActiveProjectId(pList[0].id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll().catch(() => push('Falha ao carregar dados', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeProjectId) {
      setProjectBoard(null);
      return;
    }
    setProjectBoardLoading(true);
    getProjectBoard(activeProjectId)
      .then(async (res) => {
        // Auto-upgrade SAP boards to include missing columns requested (QA/Prod/Aprovadas)
        let board = res.board;
        const p = projects.find((x) => x.id === activeProjectId);
        const type = (p?.projectType ?? 'sap') as any;

        if (type === 'sap') {
          const required = [
            { id: 'backlog', title: 'Backlog' },
            { id: 'analysis', title: 'Análise' },
            { id: 'dev', title: 'Dev' },
            { id: 'qa', title: 'QA' },
            { id: 'ready_prod', title: 'Pronto p/ Produção' },
            { id: 'in_prod', title: 'Em Produção' },
            { id: 'done_prod', title: 'Finalizado em Produção' },
            { id: 'approved', title: 'Demandas Aprovadas' },
          ];
          const existingIds = new Set(board.columns.map((c) => c.id));
          const missing = required.filter((c) => !existingIds.has(c.id));
          if (missing.length) {
            // Map old prod column if present
            const mappedCols = board.columns.map((c) => (c.id === 'prod' ? { ...c, id: 'in_prod', title: 'Em Produção' } : c));
            const mappedCards = board.cards.map((card) => (card.columnId === 'prod' ? { ...card, columnId: 'in_prod' } : card));
            board = { ...board, columns: [...mappedCols, ...missing], cards: mappedCards };
            await saveProjectBoard(activeProjectId, board).catch(() => null);
          }
        }

        setProjectBoard(board);
        const firstCol = board.columns?.[0]?.id;
        if (firstCol && !newCardColumnId) setNewCardColumnId(firstCol);
      })
      .catch(() => {
        setProjectBoard(null);
      })
      .finally(() => setProjectBoardLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (alphaFilter) {
        const n = (e.name ?? '').trim();
        if (!n.toUpperCase().startsWith(alphaFilter)) return false;
      }
      if (advFilters.scope === 'mine' && !e.canEdit) return false;
      if (advFilters.scope === 'shared' && !e.isShared) return false;
      if (advFilters.ownerEmail.trim()) {
        const own = (e.ownerEmail ?? '').toLowerCase();
        if (!own.includes(advFilters.ownerEmail.trim().toLowerCase())) return false;
      }
      if (advFilters.hasSap) {
        const has = Boolean((e as any).sapJson) || Boolean((e as any).sapConnection);
        if (!has) return false;
      }
      if (advFilters.hasVpn) {
        const has = Boolean((e as any).vpnJson) || Boolean((e as any).vpnConnection);
        if (!has) return false;
      }
      if (!q) return true;
      const blob = [e.name, e.username, e.email, e.ip, e.ownerEmail].filter(Boolean).join(' ').toLowerCase();
      return blob.includes(q);
    });
  }, [entries, query, alphaFilter, advFilters]);

  const stats = useMemo(() => {
    const total = entries.length;
    const editable = entries.filter((e) => e.canEdit).length;
    const shared = entries.filter((e) => e.isShared).length;
    return { total, editable, shared };
  }, [entries]);

  const activeProject = useMemo(
    () => (activeProjectId ? projects.find((p) => p.id === activeProjectId) || null : null),
    [projects, activeProjectId]
  );

  // Debounced save for Kanban (helps with drag/drop)
  const kanbanSaveTimer = useRef<any>(null);
  const lastBoardRef = useRef<ProjectBoard | null>(null);

  async function persistKanbanBoard(board: ProjectBoard) {
    if (!activeProjectId) return;
    try {
      await saveProjectBoard(activeProjectId, board);
      lastBoardRef.current = board;
    } catch (err) {
      push('Falha ao salvar quadro (verifique conexão/CSRF)', 'error');
    }
  }

  function setBoardAndScheduleSave(next: ProjectBoard) {
    setProjectBoard(next);
    if (kanbanSaveTimer.current) clearTimeout(kanbanSaveTimer.current);
    kanbanSaveTimer.current = setTimeout(() => {
      persistKanbanBoard(next);
    }, 800);
  }

  function openNew() {
    setEditing(null);
    setForm({
      entryType: 'generic',
      name: '',
      url: '',
      username: '',
      password: '',
      ip: '',
      email: '',
      connectionData: '',
      sapConnection: '',
      vpnConnection: '',
      notes: '',
    });
    setSapConn(emptySap);
    setVpnConn(emptyVpn);
    setMetaJsonText('');
    setModalOpen(true);
  }

  function openEdit(e: VaultEntry) {
    setEditing(e);
    const sap = (e as any).sapJson ?? null;
    const vpn = (e as any).vpnJson ?? null;
    const meta = (e as any).connectionJson ?? null;
    setSapConn({ ...emptySap, ...(sap && typeof sap === 'object' ? sap : {}) });
    setVpnConn({ ...emptyVpn, ...(vpn && typeof vpn === 'object' ? vpn : {}) });
    setMetaJsonText(meta && typeof meta === 'object' ? JSON.stringify(meta, null, 2) : (e.connectionData ?? ''));
    setForm({
      entryType: (e as any).entryType ?? (sap ? 'sap' : vpn ? 'vpn' : (meta ? 'json' : 'generic')),
      name: e.name ?? '',
      url: (e as any).url ?? '',
      username: e.username ?? '',
      password: e.password ?? '',
      ip: e.ip ?? '',
      email: e.email ?? '',
      connectionData: e.connectionData ?? '',
      sapConnection: (e as any).sapConnection ?? '',
      vpnConnection: (e as any).vpnConnection ?? '',
      notes: e.notes ?? '',
    });
    setModalOpen(true);
  }

  function openView(e: VaultEntry) {
    setViewEntry(e);
    setViewReveal(false);
    setViewOpen(true);
  }

  function openShare(e: VaultEntry) {
    if (!e.canEdit) {
      push('Somente o dono pode compartilhar essa senha', 'error');
      return;
    }
    setShareEntry(e);
    const preset: Record<string, boolean> = {};
    (e.sharedWith ?? []).forEach((uid) => (preset[uid] = true));
    setShareSelectedUids(preset);
    setShareExtraEmails('');
    setShareModalOpen(true);
  }

  async function saveEntry() {
    if (!form.name.trim()) {
      push('Informe o nome do serviço', 'error');
      return;
    }

    const hasAny = (obj: any) => Object.values(obj ?? {}).some((v: any) => String(v ?? '').trim() !== '');
    let metaPayload: any = null;
    const metaRaw = (metaJsonText ?? '').trim();
    if (metaRaw) {
      try {
        metaPayload = JSON.parse(metaRaw);
      } catch {
        // fallback: store as plain text
        metaPayload = metaRaw;
      }
    }

    const sapPayload = hasAny(sapConn) ? sapConn : null;
    const vpnPayload = hasAny(vpnConn) ? vpnConn : null;

    try {
      if (editing) {
        await updateEntry(editing.id, {
          entryType: (form as any).entryType,
          name: form.name,
          url: form.url || null,
          username: form.username || null,
          password: form.password || null,
          ip: form.ip || null,
          email: form.email || null,
          connectionData: metaPayload ?? (form.connectionData || null),
          sapConnection: sapPayload ?? (form.sapConnection || null),
          vpnConnection: vpnPayload ?? (form.vpnConnection || null),
          notes: form.notes || null,
        });
        push('Senha atualizada ✅', 'success');
      } else {
        await createEntry({
          entryType: (form as any).entryType,
          name: form.name,
          url: form.url || null,
          username: form.username || null,
          password: form.password || null,
          ip: form.ip || null,
          email: form.email || null,
          connectionData: metaPayload ?? (form.connectionData || null),
          sapConnection: sapPayload ?? (form.sapConnection || null),
          vpnConnection: vpnPayload ?? (form.vpnConnection || null),
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

  async function openDriveRoot() {
    setDriveExplorerLoading(true);
    try {
      const res = await browseDrive(null);
      setDriveItems((res.items ?? []).map((it) => ({ ...it, isFolder: it.mimeType === 'application/vnd.google-apps.folder' })));
      setDrivePath([]);
    } finally {
      setDriveExplorerLoading(false);
    }
  }

  async function enterDriveFolder(item: DriveItem) {
    if (!item.id) return;
    setDriveExplorerLoading(true);
    try {
      const res = await browseDrive(item.id);
      setDriveItems((res.items ?? []).map((it) => ({ ...it, isFolder: it.mimeType === 'application/vnd.google-apps.folder' })));
      setDrivePath((prev) => [...prev, { id: item.id, name: item.name }]);
    } finally {
      setDriveExplorerLoading(false);
    }
  }

  async function goDriveBreadcrumb(index: number) {
    // index is the last folder to keep (-1 means root)
    const newPath = drivePath.slice(0, index + 1);
    setDriveExplorerLoading(true);
    try {
      const parentId = newPath.length ? newPath[newPath.length - 1].id : null;
      const res = await browseDrive(parentId);
      setDriveItems((res.items ?? []).map((it) => ({ ...it, isFolder: it.mimeType === 'application/vnd.google-apps.folder' })));
      setDrivePath(newPath);
    } finally {
      setDriveExplorerLoading(false);
    }
  }

  async function createNewProject() {
    const name = newProjectName.trim();
    if (!name) return push('Informe o nome do projeto', 'error');
    try {
      const rate = parseFloat(String(newProjectHourlyRate).replace(',', '.'));
      await createProject(name, newProjectDesc.trim() || null, newProjectType, isFinite(rate) ? rate : null);

      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectHourlyRate('');
      push('Projeto criado ✅', 'success');

      // Recarrega lista e seleciona o recém-criado
      const projs = await listProjects().catch(() => ({ projects: [] } as any));
      const pList = (projs as any).projects ?? [];
      setProjects(pList);
      const newest = pList[0] || null;
      if (newest) setActiveProjectId(newest.id);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Falha ao criar projeto';
      push(msg, 'error');
    }
  }

  async function removeProject(id: string) {
    if (!confirm('Excluir projeto? Isso remove o quadro associado.')) return;
    try {
      await deleteProject(id);
      push('Projeto excluído', 'success');
      const ps = projects.filter((p) => p.id !== id);
      setProjects(ps);
      if (activeProjectId === id) {
        setActiveProjectId(ps[0]?.id || null);
      }
    } catch {
      push('Falha ao excluir projeto', 'error');
    }
  }

  async function saveBoard(next: ProjectBoard) {
    setBoardAndScheduleSave(next);
  }

  function normalizeOrders(board: ProjectBoard): ProjectBoard {
    // Ensure a stable order inside each column (used by drag/drop)
    const byCol: Record<string, KanbanCard[]> = {};
    for (const c of board.cards) {
      (byCol[c.columnId] = byCol[c.columnId] || []).push(c);
    }
    const nextCards: KanbanCard[] = [];
    for (const col of board.columns) {
      const list = (byCol[col.id] || []).slice().sort((a, b) => {
        const oa = typeof a.order === 'number' ? a.order : Number.POSITIVE_INFINITY;
        const ob = typeof b.order === 'number' ? b.order : Number.POSITIVE_INFINITY;
        if (oa !== ob) return oa - ob;
        return String(a.createdAt).localeCompare(String(b.createdAt));
      });
      list.forEach((card, idx) => nextCards.push({ ...card, order: idx * 10 }));
    }
    // Include cards that reference unknown columns (fallback)
    const known = new Set(board.columns.map((c) => c.id));
    const leftovers = board.cards.filter((c) => !known.has(c.columnId));
    leftovers.forEach((c, idx) => nextCards.push({ ...c, order: (c.order ?? 0) + idx }));
    return { ...board, cards: nextCards };
  }

  async function addKanbanCard(columnId: string) {
    if (!projectBoard) return;
    const title = newCardTitle.trim();
    if (!title) return push('Informe o título do card', 'error');
    const id = `c_${Math.random().toString(36).slice(2, 10)}`;
    const now = new Date().toISOString();
    const next: ProjectBoard = {
      ...projectBoard,
      cards: [
        ...projectBoard.cards,
        {
          id,
          columnId,
          title,
          description: newCardDesc.trim() || null,
          type: (projects.find((x) => x.id === activeProjectId)?.projectType ?? 'sap') as any,
          color: newCardColor,
          order: (projectBoard.cards.filter((c) => c.columnId === columnId).length ?? 0) * 10,
          createdAt: now,
          updatedAt: now,
        },
      ],
    };
    setNewCardTitle('');
    setNewCardDesc('');
    await saveBoard(next);
  }

  async function moveKanbanCard(cardId: string, columnId: string) {
    if (!projectBoard) return;
    const now = new Date().toISOString();
    const count = projectBoard.cards.filter((c) => c.columnId === columnId).length;
    const nextRaw: ProjectBoard = {
      ...projectBoard,
      cards: projectBoard.cards.map((c) =>
        c.id === cardId ? { ...c, columnId, order: count * 10, updatedAt: now } : c
      ),
    };
    await saveBoard(normalizeOrders(nextRaw));
  }

  async function deleteKanbanCard(cardId: string) {
    if (!projectBoard) return;
    const next: ProjectBoard = { ...projectBoard, cards: projectBoard.cards.filter((c) => c.id !== cardId) };
    await saveBoard(normalizeOrders(next));
  }

  function dropCardToColumn(cardId: string, columnId: string, beforeCardId?: string) {
    if (!projectBoard) return;
    const now = new Date().toISOString();
    const moving = projectBoard.cards.find((c) => c.id === cardId);
    if (!moving) return;

    const updatedMoving: KanbanCard = { ...moving, columnId, updatedAt: now };
    const without = projectBoard.cards.filter((c) => c.id !== cardId);

    let nextCards = without;
    if (beforeCardId) {
      const idx = without.findIndex((c) => c.id === beforeCardId);
      if (idx >= 0) {
        nextCards = [...without.slice(0, idx), updatedMoving, ...without.slice(idx)];
      } else {
        nextCards = [...without, updatedMoving];
      }
    } else {
      nextCards = [...without, updatedMoving];
    }

    setBoardAndScheduleSave(normalizeOrders({ ...projectBoard, cards: nextCards }));
  }

  function openCard(card: KanbanCard) {
    setActiveCard(card);
    setCardEdit({
      title: card.title ?? '',
      description: (card.description ?? '') as any,
      type: (card.type ?? 'task') as any,
      estimateHours: card.estimateHours != null ? String(card.estimateHours) : '',
      priority: (card.priority ?? 'med') as any,
      dueDate: (card.dueDate ?? '') as any,
      checklistText: Array.isArray(card.checklist)
        ? card.checklist.map((i) => `${i.done ? '[x]' : '[ ]'} ${i.text}`).join('\n')
        : '',
      color: (card.color ?? 'yellow') as any,
      qaNotes: (card.qaNotes ?? '') as any,
      prodNotes: (card.prodNotes ?? '') as any,
      tags: Array.isArray(card.tags) ? card.tags.join(', ') : '',
      approved: Boolean(card.approvedAt) || card.columnId === 'approved',
      columnId: card.columnId,
    });
    setNewCardComment('');
    setNewCardEmailSubject('');
    setNewCardEmailBody('');
    setCardModalOpen(true);
  }

  async function persistCardEdits(extraPatch?: Partial<KanbanCard>) {
    if (!projectBoard || !activeProjectId || !activeCard) return;
    const now = new Date().toISOString();
    const est = parseFloat(String(cardEdit.estimateHours).replace(',', '.'));
    const priority = (cardEdit as any).priority ?? 'med';
    const dueDateRaw = String((cardEdit as any).dueDate ?? '').trim();
    const color = (cardEdit as any).color ?? 'yellow';
    const checklistText = String((cardEdit as any).checklistText ?? '').trim();
    const checklist = checklistText
      ? checklistText
          .split(/\r?\n/g)
          .map((line) => line.trim())
          .filter(Boolean)
          .slice(0, 30)
          .map((line, idx) => {
            const done = /^\[x\]/i.test(line) || /^-\s*\[x\]/i.test(line);
            const text = line.replace(/^(-\s*)?\[[x \]]\]\s*/i, '').slice(0, 140) || `Item ${idx + 1}`;
            return { id: `i_${idx}_${Math.random().toString(36).slice(2, 7)}`, text, done };
          })
      : null;
    const nextCard: KanbanCard = {
      ...activeCard,
      title: cardEdit.title.trim() || activeCard.title,
      description: cardEdit.description?.trim() ? cardEdit.description.trim() : null,
      type: cardEdit.type as any,
      estimateHours: isFinite(est) ? est : null,
      priority: (['low', 'med', 'high', 'urgent'].includes(priority) ? priority : 'med') as any,
      dueDate: dueDateRaw || null,
      checklist,
      color: (['yellow', 'blue', 'green', 'pink', 'white'].includes(color) ? color : 'yellow') as any,
      qaNotes: cardEdit.qaNotes?.trim() ? cardEdit.qaNotes.trim() : null,
      prodNotes: cardEdit.prodNotes?.trim() ? cardEdit.prodNotes.trim() : null,
      tags: cardEdit.tags
        ? cardEdit.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : null,
      updatedAt: now,
      ...(extraPatch || {}),
    };

    let columnId = cardEdit.columnId;
    if (cardEdit.approved && projectBoard.columns.some((c) => c.id === 'approved')) {
      columnId = 'approved';
    }
    nextCard.columnId = columnId;
    if (cardEdit.approved && !nextCard.approvedAt) nextCard.approvedAt = now;

    const next: ProjectBoard = {
      ...projectBoard,
      cards: projectBoard.cards.map((c) => (c.id === activeCard.id ? (nextCard as any) : c)),
    };

    setActiveCard(nextCard);
    await saveBoard(next);
    push('Card atualizado ✅', 'success');
  }

  async function saveCardEdits() {
    await persistCardEdits();
    setCardModalOpen(false);
  }

  async function addCardComment() {
    if (!projectBoard || !activeProjectId || !activeCard) return;
    const text = newCardComment.trim();
    if (!text) return;
    const now = new Date().toISOString();
    const nextCard: KanbanCard = {
      ...activeCard,
      comments: [...(activeCard.comments ?? []), { at: now, text }],
      updatedAt: now,
    };
    const next: ProjectBoard = {
      ...projectBoard,
      cards: projectBoard.cards.map((c) => (c.id === activeCard.id ? nextCard : c)),
    };
    setActiveCard(nextCard);
    setNewCardComment('');
    await saveBoard(next);
  }

  async function addCardEmail() {
    if (!projectBoard || !activeProjectId || !activeCard) return;
    const subj = newCardEmailSubject.trim();
    const body = newCardEmailBody.trim();
    if (!subj && !body) return;
    const now = new Date().toISOString();
    const nextCard: KanbanCard = {
      ...activeCard,
      emails: [...(activeCard.emails ?? []), { at: now, subject: subj || '(sem assunto)', body }],
      updatedAt: now,
    };
    const next: ProjectBoard = {
      ...projectBoard,
      cards: projectBoard.cards.map((c) => (c.id === activeCard.id ? nextCard : c)),
    };
    setActiveCard(nextCard);
    setNewCardEmailSubject('');
    setNewCardEmailBody('');
    await saveBoard(next);
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
      onClick={() => { setSection(id); setMobileMenuOpen(false); }}
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
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-xs bg-white shadow-soft border-r border-zinc-200 p-4 flex flex-col">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 text-white flex items-center justify-center shadow-sm shrink-0">
                  <Icon name="shield" className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold leading-tight truncate">SecureVault</div>
                  <div className="text-xs text-zinc-500 truncate">{userEmail}</div>
                </div>
              </div>
              <button
                type="button"
                className="h-10 w-10 rounded-2xl border border-zinc-200/70 bg-white flex items-center justify-center text-zinc-700 hover:bg-zinc-50"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fechar"
              >
                <Icon name="x" className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <SectionButton id="vault" label="Minhas Senhas" icon={<Icon name="lock" className="h-5 w-5" />} />
              <SectionButton id="sharing" label="Compartilhamentos" icon={<Icon name="share" className="h-5 w-5" />} />
              <SectionButton id="drive" label="Drive Seguro" icon={<Icon name="drive" className="h-5 w-5" />} />
              <SectionButton id="projects" label="Projetos" icon={<Icon name="projects" className="h-5 w-5" />} />
              <SectionButton id="notes" label="Bloco de Notas" icon={<Icon name="note" className="h-5 w-5" />} />
            </div>

            <div className="mt-auto pt-4">
              <div className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">Conta</div>
                  <div className="text-xs text-zinc-500 truncate">{userEmail}</div>
                </div>
                <Button variant="secondary" className="px-3 py-2" onClick={() => { setMobileMenuOpen(false); onLogout(); }} >
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <SectionButton id="projects" label="Projetos" icon={<Icon name="projects" className="h-5 w-5" />} />
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
            <div className="w-full px-6 sm:px-8 lg:px-10 2xl:px-14 pt-5">
              <div className="rounded-3xl border border-zinc-200/70 bg-white/70 backdrop-blur shadow-sm px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="md:hidden h-10 w-10 rounded-2xl border border-zinc-200/70 bg-white/80 backdrop-blur shadow-sm flex items-center justify-center text-violet-700 hover:bg-white"
                    onClick={() => setMobileMenuOpen(true)}
                    aria-label="Menu"
                  >
                    <Icon name="menu" className="h-6 w-6" />
                  </button>
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
                  <Button
                    variant="secondary"
                    className="shrink-0"
                    onClick={() => setFilterModalOpen(true)}
                    title="Filtro avançado"
                  >
                    <Icon name="filter" className="h-4 w-4" />
                  </Button>
                  <Button className="shrink-0" onClick={openNew}>
                    <Icon name="plus" className="h-4 w-4 mr-2" />
                    Nova Senha
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="w-full px-6 sm:px-8 lg:px-10 2xl:px-14 py-6">
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
            <div className="md:hidden mt-4 grid grid-cols-5 gap-2">
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
                onClick={() => setSection('projects')}
                className={cn(
                  'rounded-2xl border border-zinc-200/70 bg-white/70 py-2 text-xs font-medium',
                  section === 'projects' && 'bg-violet-600 text-white border-violet-500'
                )}
              >
                Projetos
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
              <VaultSection
                loading={loading}
                filtered={filtered}
                alphaFilter={alphaFilter}
                setAlphaFilter={setAlphaFilter}
                revealedIds={revealedIds}
                setRevealedIds={setRevealedIds}
                maskPassword={maskPassword}
                openView={openView}
                openShare={openShare}
                openEdit={openEdit}
                removeEntry={removeEntry}
                EntryInlineActions={EntryInlineActions}
              />
            )}

            {/* Sharing */}
            {section === 'sharing' && (
              <SharingSection
                loading={loading}
                shareEmail={shareEmail}
                setShareEmail={setShareEmail}
                doSendInvite={doSendInvite}
                connections={connections}
                receivedInvites={receivedInvites}
                sentInvites={sentInvites}
                doAccept={doAccept}
                doDecline={doDecline}
                refreshAll={refreshAll}
              />
            )}

            {/* Drive */}
            {section === 'drive' && (
              <DriveSection
                loading={loading}
                driveOpenUrl={driveOpenUrl}
                driveFolder={driveFolder}
                setDriveFolderState={setDriveFolderState}
                saveDriveFolder={saveDriveFolder}
                driveEnabled={driveEnabled}
                driveNeedsSetup={driveNeedsSetup}
                driveFiles={driveFiles}
                removeDriveFile={removeDriveFile}
                driveExplorerLoading={driveExplorerLoading}
                openDriveRoot={openDriveRoot}
                drivePath={drivePath}
                goDriveBreadcrumb={goDriveBreadcrumb}
                driveItems={driveItems}
                enterDriveFolder={enterDriveFolder}
                pushToast={push}
              />
            )}

            {/* Projects / Kanban */}
            {section === 'projects' && (
              <ProjectsSection
                projects={projects}
                activeProjectId={activeProjectId}
                setActiveProjectId={setActiveProjectId}
                newProjectName={newProjectName}
                setNewProjectName={setNewProjectName}
                newProjectDesc={newProjectDesc}
                setNewProjectDesc={setNewProjectDesc}
                newProjectType={newProjectType}
                setNewProjectType={setNewProjectType}
                newProjectHourlyRate={newProjectHourlyRate}
                setNewProjectHourlyRate={setNewProjectHourlyRate}
                createNewProject={createNewProject}
                creatingProject={creatingProject}
                removeProject={removeProject}
                setProjectShareTarget={setProjectShareTarget}
                setProjectShareOpen={setProjectShareModalOpen}
                projectBoard={projectBoard}
                projectBoardLoading={projectBoardLoading}
                newColumnTitle={newColumnTitle}
                setNewColumnTitle={setNewColumnTitle}
                addKanbanColumn={addKanbanColumn}
                newCardTitle={newCardTitle}
                setNewCardTitle={setNewCardTitle}
                newCardDesc={newCardDesc}
                setNewCardDesc={setNewCardDesc}
                newCardColor={newCardColor}
                setNewCardColor={setNewCardColor}
                addKanbanCard={addKanbanCard}
                deleteKanbanCard={deleteKanbanCard}
                moveKanbanCard={moveKanbanCard}
                openCard={openCard}
              />
            )}

            {/* Notes */}
            {section === 'notes' && (
              <NotesSection
                loading={loading}
                notes={notes}
                notesDirty={notesDirty}
                notesUpdatedAt={notesUpdatedAt}
                onNotesChange={(v) => {
                  setNotes(v);
                  setNotesDirty(true);
                }}
                onSaveQuickNotes={saveQuickNotes}
                noteItems={noteItems}
                noteQuery={noteQuery}
                setNoteQuery={setNoteQuery}
                onClearQuery={() => setNoteQuery('')}
                onNewNote={() => {
                  setEditingNote(null);
                  setNoteModalOpen(true);
                  setNoteForm({ title: '', content: '' });
                }}
                onEditNote={(n) => {
                  setEditingNote(n);
                  setNoteForm({ title: n.title ?? '', content: n.content ?? '' });
                  setNoteModalOpen(true);
                }}
                onDeleteNote={(n) => deleteNote(n.id)}
                onCopyContent={(content) => copyToClipboard(content)}
              />
            )}

          </div>
        </main>
      </div>

      {/* Modal create/edit */}
      <EntryEditModal
        open={modalOpen}
        editing={!!editing}
        form={form}
        setForm={setForm as any}
        sapConn={sapConn as any}
        setSapConn={setSapConn as any}
        vpnConn={vpnConn as any}
        setVpnConn={setVpnConn as any}
        onClose={() => setModalOpen(false)}
        onSave={saveEntry}
      />

      {/* Modal view details */}

      <Modal
        open={viewOpen}
        title={viewEntry ? `Senha: ${viewEntry.name}` : 'Detalhes da senha'}
        onClose={() => setViewOpen(false)}
        size="lg"
      >
        {viewEntry ? (
          (() => {
            const ve: any = viewEntry;
            const safeParse = (v: any) => {
              if (!v) return null;
              if (typeof v === 'object') return v;
              if (typeof v !== 'string') return null;
              const t = v.trim();
              if (!t) return null;
              try {
                if (t.startsWith('{') && t.endsWith('}')) return JSON.parse(t);
              } catch {
                return null;
              }
              return null;
            };

            const sap = ve.sapJson ?? safeParse(ve.sapConnection);
            const vpn = ve.vpnJson ?? safeParse(ve.vpnConnection);
            const meta = ve.connectionJson ?? safeParse(ve.connectionData);
            const pass = ve.password ?? '';
            const url = ve.url ? (String(ve.url).startsWith('http') ? ve.url : `https://${ve.url}`) : '';

            const Row = ({ label, value, copyable = true, mono = false, openUrl = false }: any) => (
              <div className="rounded-2xl border border-zinc-200/70 bg-white px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
                    {openUrl && value ? (
                      <a
                        href={value}
                        target="_blank"
                        rel="noreferrer"
                        className={cn('mt-1 text-sm break-all text-violet-700 hover:underline', mono && 'font-mono')}
                      >
                        {value}
                      </a>
                    ) : (
                      <div className={cn('mt-1 text-sm break-all text-zinc-800', mono && 'font-mono')}>
                        {value || '—'}
                      </div>
                    )}
                  </div>
                  {copyable && value ? (
                    <Button type="button" variant="secondary" onClick={() => copyToClipboard(String(value))} title="Copiar">
                      <Icon name="copy" className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            );

            const JsonBlock = ({ title, obj }: any) => (
              <div className="rounded-2xl border border-zinc-200/70 bg-white px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-zinc-500">{title}</div>
                    <div className="mt-2 text-xs font-mono whitespace-pre-wrap break-words text-zinc-800 max-h-56 overflow-y-auto">
                      {JSON.stringify(obj, null, 2)}
                    </div>
                  </div>
                  <Button type="button" variant="secondary" onClick={() => copyToClipboard(JSON.stringify(obj, null, 2))} title="Copiar JSON">
                    <Icon name="copy" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );

            return (
              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-200/70 bg-white px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{ve.name}</span>
                    {ve.isShared ? (
                      <span className="text-xs rounded-full bg-violet-100 text-violet-800 px-2 py-1">Compartilhado</span>
                    ) : (
                      <span className="text-xs rounded-full bg-zinc-100 text-zinc-700 px-2 py-1">Privado</span>
                    )}
                    {ve.ownerEmail ? (
                      <span className="text-xs text-zinc-500">• Dono: {ve.ownerEmail}</span>
                    ) : null}
                    {ve.sharedByEmail ? (
                      <span className="text-xs text-zinc-500">• Compartilhado por: {ve.sharedByEmail}</span>
                    ) : null}
                  </div>
                  {ve.notes ? <div className="mt-2 text-sm text-zinc-700 whitespace-pre-wrap">{ve.notes}</div> : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Row label="Usuário" value={ve.username} />
                  <Row label="E-mail" value={ve.email} />
                  <Row label={`IP ${'/'} Host`} value={ve.ip} mono />
                  <Row label="URL" value={url} openUrl copyable={!!url} />
                </div>

                <div className="rounded-2xl border border-zinc-200/70 bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wide text-zinc-500">Senha</div>
                      <div className="mt-1 text-sm font-mono break-all text-zinc-800">
                        {pass ? (viewReveal ? pass : maskPassword(pass)) : '—'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="secondary" onClick={() => setViewReveal((p) => !p)} disabled={!pass} title={viewReveal ? 'Ocultar' : 'Mostrar'}>
                        <Icon name="eye" className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => copyToClipboard(String(pass))} disabled={!pass} title="Copiar senha">
                        <Icon name="copy" className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {sap ? <JsonBlock title="Conexão SAP" obj={sap} /> : null}
                {vpn ? <JsonBlock title="Conexão VPN" obj={vpn} /> : null}
                {meta ? <JsonBlock title="Dados gerais (JSON/ENV/App)" obj={meta} /> : null}
              </div>
            );
          })()
        ) : (
          <div className="text-sm text-zinc-500">Nenhuma senha selecionada.</div>
        )}
      </Modal>

      <Modal open={noteModalOpen} title={editingNote ? 'Editar nota' : 'Nova nota'} onClose={() => setNoteModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-600">Título</label>
            <Input value={noteForm.title} onChange={(e) => setNoteForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ex.: Dúvida sobre ICMS" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Conteúdo</label>
            <Textarea value={noteForm.content} onChange={(e) => setNoteForm((p) => ({ ...p, content: e.target.value }))} rows={10} placeholder="Cole aqui um e-mail, uma anotação, um log, etc." className="bg-white/90" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setNoteModalOpen(false)}>Cancelar</Button>
            <Button
              onClick={async () => {
                const title = noteForm.title.trim() || 'Sem título';
                const content = noteForm.content;
                try {
                  if (editingNote) {
                    const r = await updateNoteItem(editingNote.id, { title, content });
                    setNoteItems((p) => p.map((x) => (x.id === editingNote.id ? r.item : x)));
                  } else {
                    const r = await createNoteItem({ title, content });
                    setNoteItems((p) => [r.item, ...p]);
                  }
                  setNoteModalOpen(false);
                } catch {
                  push('Falha ao salvar nota', 'error');
                }
              }}
            >
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal filtros avançados */}
      <Modal
        open={filterModalOpen}
        title="Filtro avançado"
        onClose={() => setFilterModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="adv-scope" className="text-xs font-medium text-zinc-600">Escopo</label>
            <select id="adv-scope" aria-label="Escopo" title="Escopo"
              className="mt-1 w-full rounded-xl border border-zinc-200/70 bg-white px-3 py-2 text-sm"
              value={advFilters.scope}
              onChange={(e) => setAdvFilters((p) => ({ ...p, scope: e.target.value as any }))}
            >
              <option value="all">Tudo</option>
              <option value="mine">Somente minhas (editáveis)</option>
              <option value="shared">Somente compartilhadas comigo</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Filtrar por e-mail do dono (who shared)</label>
            <Input
              value={advFilters.ownerEmail}
              onChange={(e) => setAdvFilters((p) => ({ ...p, ownerEmail: e.target.value }))}
              placeholder="ex.: consultor@empresa.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 rounded-2xl border border-zinc-200/70 bg-white px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={advFilters.hasSap}
                onChange={(e) => setAdvFilters((p) => ({ ...p, hasSap: e.target.checked }))}
              />
              <span>Somente com SAP</span>
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-zinc-200/70 bg-white px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={advFilters.hasVpn}
                onChange={(e) => setAdvFilters((p) => ({ ...p, hasVpn: e.target.checked }))}
              />
              <span>Somente com VPN</span>
            </label>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setAdvFilters({ scope: 'all', ownerEmail: '', hasSap: false, hasVpn: false });
                setAlphaFilter('');
              }}
            >
              Limpar filtros
            </Button>
            <Button onClick={() => setFilterModalOpen(false)}>Aplicar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal compartilhar senha */}
      <Modal
        open={shareModalOpen}
        title={shareEntry ? `Compartilhar: ${shareEntry.name}` : 'Compartilhar senha'}
        onClose={() => {
          setShareModalOpen(false);
          setShareEntry(null);
        }}
      >
        <div className="text-sm text-zinc-600">
          Selecione os usuários que terão acesso de leitura a esta senha. Os destinatários verão <b>quem compartilhou</b> (e-mail do dono) no painel.
        </div>

        <div className="mt-4 space-y-2">
          <div className="rounded-2xl border border-zinc-200/70 bg-white px-4 py-3 text-sm text-zinc-600">
            <div className="font-medium text-zinc-800">Adicionar destinatários</div>
            <div className="mt-1 text-xs text-zinc-500">
              Você pode selecionar conexões aceitas abaixo <b>ou</b> colar e-mails diretamente (separados por vírgula, espaço ou linha).
            </div>
            <Textarea
              value={shareExtraEmails}
              onChange={(e) => setShareExtraEmails(e.target.value)}
              rows={3}
              placeholder="ex.: consultor@empresa.com, time@cliente.com"
              className="mt-3 bg-white/90"
            />
          </div>

          {connections.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200/70 bg-white px-4 py-3 text-sm text-zinc-600">
              Você ainda não tem conexões aceitas. Vá em <b>Compartilhamento</b> e envie um convite para outro usuário (isso facilita selecionar com 1 clique).
            </div>
          ) : (
            connections.map((c) => {
              const checked = Boolean(shareSelectedUids[c.uid]);
              return (
                <label key={c.uid} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/70 bg-white px-4 py-3">
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-800 truncate">{c.email ?? c.uid}</div>
                    <div className="text-xs text-zinc-500 truncate">Conexão aceita</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setShareSelectedUids((prev) => ({ ...prev, [c.uid]: v }));
                    }}
                    className="h-4 w-4 accent-violet-600"
                  />
                </label>
              );
            })
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={() => setShareModalOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              if (!shareEntry) return;
              try {
                const uids = Object.entries(shareSelectedUids)
                  .filter(([, v]) => v)
                  .map(([uid]) => uid);
                const emails = shareExtraEmails
                  .split(/[\s,;\n\r\t]+/g)
                  .map((x) => x.trim())
                  .filter(Boolean);
                await updateEntryShare(shareEntry.id, { uids, emails });
                push('Compartilhamento atualizado ✅', 'success');
                setShareModalOpen(false);
                setShareEntry(null);
                await refreshAll();
              } catch (err: any) {
                const invalid = err?.response?.data?.invalidEmails;
                if (Array.isArray(invalid) && invalid.length) {
                  push(`E-mails inválidos/não encontrados: ${invalid.join(', ')}`, 'error');
                } else {
                  const msg = err?.response?.data?.error || 'Falha ao compartilhar';
                  push(msg, 'error');
                }
              }
            }}
          >
            Salvar compartilhamento
          </Button>
        </div>

      </Modal>

      {/* Modal compartilhar projeto */}
      <Modal
        open={projectShareModalOpen}
        title={projectShareTarget ? `Compartilhar projeto: ${projectShareTarget.name}` : 'Compartilhar projeto'}
        onClose={() => {
          setProjectShareModalOpen(false);
          setProjectShareTarget(null);
        }}
      >
        <div className="text-sm text-zinc-600">
          Escolha quem vai acompanhar{'/'}editar o Kanban. Colaboradores conseguem <b>criar{'/'}editar{'/'}mover cards</b>, mas <b>não</b> conseguem excluir o projeto nem compartilhar com outras pessoas.
        </div>

        <div className="mt-4 space-y-2">
          <div className="rounded-2xl border border-zinc-200/70 bg-white px-4 py-3 text-sm text-zinc-600">
            <div className="font-medium text-zinc-800">Adicionar por e-mail (opcional)</div>
            <div className="mt-1 text-xs text-zinc-500">
              Cole e-mails separados por vírgula, espaço ou linha. Apenas usuários já cadastrados no sistema serão encontrados.
            </div>
            <Textarea
              value={projectShareEmails}
              onChange={(e) => setProjectShareEmails(e.target.value)}
              rows={3}
              placeholder="ex.: consultor@empresa.com, time@cliente.com"
              className="mt-3 bg-white/90"
            />
          </div>

          {connections.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200/70 bg-white px-4 py-3 text-sm text-zinc-600">
              Você ainda não tem conexões aceitas. Vá em <b>Compartilhamento</b> e envie um convite para outro usuário.
            </div>
          ) : (
            connections.map((c) => {
              const checked = projectShareSelectedUids.includes(c.uid);
              return (
                <label key={c.uid} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/70 bg-white px-4 py-3">
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-800 truncate">{c.email ?? c.uid}</div>
                    <div className="text-xs text-zinc-500 truncate">Conexão aceita</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setProjectShareSelectedUids((prev) => (v ? [...prev, c.uid] : prev.filter((x) => x !== c.uid)));
                    }}
                    className="h-4 w-4 accent-violet-600"
                  />
                </label>
              );
            })
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={() => setProjectShareModalOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              if (!projectShareTarget) return;
              try {
                const emails = projectShareEmails
                  .split(/[\s,;\n\r\t]+/g)
                  .map((x) => x.trim())
                  .filter(Boolean);
                const uids = projectShareSelectedUids;
                const resp = await shareProject(projectShareTarget.id, { emails, uids });
                const unresolved = (resp as any)?.unresolvedEmails;
                if (Array.isArray(unresolved) && unresolved.length) {
                  push(
                    `Alguns e-mails não foram encontrados no sistema (serão mantidos como convite por e-mail): ${unresolved.join(', ')}`,
                    'info'
                  );
                }
                push('Projeto compartilhado ✅', 'success');
                setProjectShareModalOpen(false);
                setProjectShareTarget(null);
                await refreshAll();
              } catch (err: any) {
                const unresolved = err?.response?.data?.unresolvedEmails || err?.response?.data?.invalidEmails;
                if (Array.isArray(unresolved) && unresolved.length) {
                  push(`E-mails não encontrados: ${unresolved.join(', ')}`, 'error');
                } else {
                  const msg = err?.response?.data?.error || 'Falha ao compartilhar projeto';
                  push(msg, 'error');
                }
              }
            }}
          >
            Salvar compartilhamento
          </Button>
        </div>
      </Modal>

      {/* Modal resumo: aprovadas / finalizadas */}
      <Modal
        open={projectSummaryModal !== null}
        onClose={() => setProjectSummaryModal(null)}
        title={projectSummaryModal === 'approved' ? 'Demandas aprovadas' : 'Demandas finalizadas'}
      >
        {!projectBoard ? (
          <div className="text-sm text-zinc-600">Nenhum projeto selecionado.</div>
        ) : (() => {
          const approvedIds = projectBoard.columns
            .filter((c: any) => String(c.id).toLowerCase().includes('approved'))
            .map((c: any) => c.id);
          const finalizedIds = projectBoard.columns
            .filter((c: any) => {
              const id = String(c.id).toLowerCase();
              return id.includes('done') || id.includes('prod') || id.includes('final');
            })
            .map((c: any) => c.id);
          const ids = projectSummaryModal === 'approved' ? approvedIds : finalizedIds;
          const cards = (projectBoard.cards || []).filter((c: any) => ids.includes(c.columnId));
          const totalHrs = cards.reduce((acc: number, c: any) => acc + (Number(c.estimateHours) || 0), 0);
          return (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-700">
                  <span className="font-semibold">{cards.length}</span> demandas • <span className="font-semibold">{totalHrs}</span>h estimadas
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const text = cards
                      .map((c: any) => `- ${c.title} (${Number(c.estimateHours) || 0}h)${c.dueDate ? ` • due ${c.dueDate}` : ''}`)
                      .join('\n');
                    navigator.clipboard.writeText(text);
                    push('Lista copiada ✅', 'success');
                  }}
                >
                  Copiar lista
                </Button>
              </div>

              <div className="max-h-[60vh] overflow-auto space-y-2 pr-1">
                {cards.length === 0 ? (
                  <div className="text-sm text-zinc-600">Nenhuma demanda.</div>
                ) : (
                  cards.map((c: any) => (
                    <div key={c.id} className="rounded-2xl border bg-white p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-zinc-900 truncate">{c.title}</div>
                          <div className="mt-1 text-xs text-zinc-600 flex flex-wrap gap-2">
                            {c.priority ? <span className="rounded-full border px-2 py-0.5">Prioridade: {c.priority}</span> : null}
                            {c.dueDate ? <span className="rounded-full border px-2 py-0.5">Due: {c.dueDate}</span> : null}
                            <span className="rounded-full border px-2 py-0.5">{Number(c.estimateHours) || 0}h</span>
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setActiveCard(c);
                            setCardEdit({ ...c });
                            setCardModalOpen(true);
                          }}
                        >
                          Abrir
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Modal detalhes da demanda (Kanban) */}
      <Modal open={cardModalOpen} onClose={() => setCardModalOpen(false)} title="Detalhes da demanda">
        {!activeCard || !projectBoard ? (
          <div className="text-sm text-zinc-600">Selecione uma demanda.</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600">Título</label>
                <Input
                  value={cardEdit.title}
                  onChange={(e) => setCardEdit((p: any) => ({ ...p, title: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600">Descrição</label>
                <Textarea
                  value={cardEdit.description}
                  onChange={(e) => setCardEdit((p: any) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-600">Tipo</label>
                <select
                  value={cardEdit.type}
                  onChange={(e) => setCardEdit((p: any) => ({ ...p, type: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="task">Task</option>
                  <option value="bug">Bug</option>
                  <option value="story">Story</option>
                  <option value="research">Research</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-600">Estimativa (h)</label>
                <Input
                  value={cardEdit.estimateHours}
                  onChange={(e) => setCardEdit((p: any) => ({ ...p, estimateHours: e.target.value }))}
                  placeholder="ex.: 3.5"
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="card-priority" className="text-xs font-medium text-zinc-600">Prioridade</label>
                <select id="card-priority" aria-label="Prioridade" title="Prioridade"
                  value={(cardEdit as any).priority}
                  onChange={(e) => setCardEdit((p: any) => ({ ...p, priority: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="low">Baixa</option>
                  <option value="med">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-600">Prazo</label>
                <Input
                  type="date"
                  value={(cardEdit as any).dueDate}
                  onChange={(e) => setCardEdit((p: any) => ({ ...p, dueDate: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-600">Cor do card</label>
                <select
                  value={(cardEdit as any).color}
                  onChange={(e) => setCardEdit((p: any) => ({ ...p, color: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="yellow">Post-it Amarelo</option>
                  <option value="blue">Azul</option>
                  <option value="green">Verde</option>
                  <option value="pink">Rosa</option>
                  <option value="white">Branco</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600">Checklist</label>
                <Textarea
                  value={(cardEdit as any).checklistText}
                  onChange={(e) => setCardEdit((p: any) => ({ ...p, checklistText: e.target.value }))}
                  placeholder="Use uma linha por item. Marque como [x] para concluído.\nEx.:\n[ ] Ajustar nota\n[x] Validar QA"
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600">Tags (separadas por vírgula)</label>
                <Input
                  value={cardEdit.tags}
                  onChange={(e) => setCardEdit((p: any) => ({ ...p, tags: e.target.value }))}
                  placeholder="ex.: FI, NF-e, UI"
                  className="mt-1"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="card-column" className="text-xs font-medium text-zinc-600">Coluna</label>
                <select id="card-column" aria-label="Coluna" title="Coluna"
                  value={cardEdit.columnId}
                  onChange={(e) => setCardEdit((p: any) => ({ ...p, columnId: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                >
                  {projectBoard.columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={cardEdit.approved}
                    onChange={(e) => setCardEdit((p: any) => ({ ...p, approved: e.target.checked }))}
                    className="h-4 w-4 accent-violet-600"
                  />
                  Demanda aprovada
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-600">Notas de QA</label>
                <Textarea
                  value={cardEdit.qaNotes}
                  onChange={(e) => setCardEdit((p: any) => ({ ...p, qaNotes: e.target.value }))}
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">Notas de Produção</label>
                <Textarea
                  value={cardEdit.prodNotes}
                  onChange={(e) => setCardEdit((p: any) => ({ ...p, prodNotes: e.target.value }))}
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/70 bg-white p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-zinc-800">Comentários</div>
                <div className="text-xs text-zinc-500">{(activeCard.comments?.length ?? 0)} itens</div>
              </div>

              <div className="mt-2 space-y-2 max-h-40 overflow-auto pr-1">
                {(activeCard.comments ?? []).length ? (
                  (activeCard.comments ?? []).map((cmt, idx) => (
                    <div key={idx} className="rounded-xl border border-zinc-200/70 bg-white px-3 py-2">
                      <div className="text-xs text-zinc-500">{new Date(cmt.at).toLocaleString()}</div>
                      <div className="text-sm text-zinc-800 whitespace-pre-wrap">{cmt.text}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-zinc-500">Sem comentários ainda.</div>
                )}
              </div>

              <div className="mt-3">
                <Textarea
                  value={newCardComment}
                  onChange={(e) => setNewCardComment(e.target.value)}
                  rows={2}
                  placeholder="Adicionar comentário..."
                />
                <div className="mt-2 flex justify-end">
                  <Button variant="secondary" onClick={addCardComment}>
                    Adicionar comentário
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/70 bg-white p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-zinc-800">E-mails</div>
                <div className="text-xs text-zinc-500">{(activeCard.emails?.length ?? 0)} itens</div>
              </div>

              <div className="mt-2 space-y-2 max-h-40 overflow-auto pr-1">
                {(activeCard.emails ?? []).length ? (
                  (activeCard.emails ?? []).map((em, idx) => (
                    <div key={idx} className="rounded-xl border border-zinc-200/70 bg-white px-3 py-2">
                      <div className="text-xs text-zinc-500">{new Date(em.at).toLocaleString()}</div>
                      <div className="text-sm text-zinc-800 font-medium whitespace-pre-wrap">{em.subject}</div>
                      <div className="text-sm text-zinc-700 whitespace-pre-wrap mt-1">{em.body}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-zinc-500">Nenhum e-mail registrado.</div>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                <Input value={newCardEmailSubject} onChange={(e) => setNewCardEmailSubject(e.target.value)} placeholder="Assunto do e-mail" />
                <Textarea value={newCardEmailBody} onChange={(e) => setNewCardEmailBody(e.target.value)} rows={3} placeholder="Conteúdo do e-mail..." />
                <div className="flex justify-end">
                  <Button variant="secondary" onClick={addCardEmail}>
                    Registrar e-mail
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setCardModalOpen(false)}>
                Fechar
              </Button>
              <Button onClick={saveCardEdits}>Salvar alterações</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}