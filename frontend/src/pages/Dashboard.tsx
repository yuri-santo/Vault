import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { Modal } from '../components/modal';
import { useToast } from '../components/toast';

function Icon({ name, className }: { name: 'shield' | 'lock' | 'share' | 'drive' | 'projects' | 'folder' | 'file' | 'note' | 'search' | 'filter' | 'dots' | 'copy' | 'eye' | 'edit' | 'trash' | 'plus' | 'externalLink' | 'menu' | 'x' | 'info'; className?: string }) {
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
    case 'projects':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7a2 2 0 0 1 2-2h5v14H6a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M11 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7V5z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M7 9h2M7 12h2M7 15h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'folder':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'file':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.7" />
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
    case 'filter':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 5h18l-7 8v6l-4-2v-4L3 5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      );
    case 'dots':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 6.6a1.2 1.2 0 1 0 0 .01V6.6zM12 12a1.2 1.2 0 1 0 0 .01V12zM12 17.4a1.2 1.2 0 1 0 0 .01v-.01z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'externalLink':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M14 5h5v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 14L19 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M19 14v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
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
    case 'menu':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'x':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'info':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M12 10v7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M12 7h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
  }
}

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
                          <div key={i} className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_260px] gap-3 items-center">
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
                                    {e.isShared ? `Compartilhado por ${e.ownerEmail || '—'}` : (e.email || e.ip || e.ownerEmail || '—')}
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
                                  onRevealToggle={() => setRevealedIds((prev) => ({ ...prev, [e.id]: !prev[e.id] }))}
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
                                  <div className="text-sm text-zinc-800 break-all mt-1">{e.username || '—'}</div>
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
                                  {e.isShared ? `Compartilhado por ${e.ownerEmail || '—'}` : (e.ownerEmail || '—')}
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
                                  onRevealToggle={() => setRevealedIds((prev) => ({ ...prev, [e.id]: !prev[e.id] }))}
                                  onView={() => openView(e)}
                                  onShare={() => openShare(e)}
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
            {section === 'drive' ? (
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
                              <Button variant="secondary" onClick={() => removeDriveFile(f.id)}>
                                Remover
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-xs text-zinc-500">
                    <b>Remover</b> aqui apenas oculta o arquivo da sua lista (não apaga do Drive). Para organizar ou excluir de verdade, use <b>Abrir pasta</b>.
                  </div>
                </div>

                <div className="mt-8">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-xs font-semibold text-zinc-600">Explorer (estilo Finder)</div>
                      <div className="text-xs text-zinc-500">Navegue pelas pastas do link salvo (pastas e arquivos).</div>
                    </div>
                    <Button variant="secondary" onClick={openDriveRoot} disabled={driveExplorerLoading || driveNeedsSetup}>
                      Abrir raiz
                    </Button>
                  </div>

                  <div className="mt-2 rounded-3xl border border-zinc-200/70 bg-white/70 backdrop-blur shadow-sm p-4">
                    {driveNeedsSetup ? (
                      <div className="text-sm text-zinc-500">Defina uma pasta acima e clique em <b>Abrir raiz</b>.</div>
                    ) : driveExplorerLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
                          <button type="button" className="hover:text-violet-700" onClick={() => goDriveBreadcrumb(-1)}>
                            Raiz
                          </button>
                          {drivePath.map((p, idx) => (
                            <span key={p.id} className="flex items-center gap-2">
                              <span className="opacity-50">›</span>
                              <button type="button" className="hover:text-violet-700" onClick={() => goDriveBreadcrumb(idx)}>
                                {p.name}
                              </button>
                            </span>
                          ))}
                        </div>

                        <div className="mt-3 divide-y divide-zinc-100">
                          {driveItems.length === 0 ? (
                            <div className="py-8 text-sm text-zinc-500">Pasta vazia.</div>
                          ) : (
                            driveItems.map((it) => (
                              <div key={it.id} className="py-3 flex items-center justify-between gap-3">
                                <div className="min-w-0 flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-2xl border border-zinc-200/70 bg-white flex items-center justify-center">
                                    <Icon name={it.isFolder ? 'folder' : 'file'} className="h-4 w-4 text-violet-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium truncate">{it.name}</div>
                                    <div className="text-xs text-zinc-500 truncate">{it.isFolder ? 'Pasta' : 'Arquivo'} {it.modifiedTime ? `• ${new Date(it.modifiedTime).toLocaleString()}` : ''}</div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {it.isFolder ? (
                                    <Button variant="secondary" onClick={() => enterDriveFolder(it)}>
                                      Abrir
                                    </Button>
                                  ) : it.webViewLink ? (
                                    <a href={it.webViewLink} target="_blank" rel="noreferrer" className="text-sm text-violet-700 hover:text-violet-800 font-medium">
                                      Visualizar
                                    </a>
                                  ) : null}
                                  <Button
                                    variant="secondary"
                                    onClick={() => {
                                      navigator.clipboard.writeText(it.webViewLink || '').then(() => push('Link copiado', 'success'));
                                    }}
                                    disabled={!it.webViewLink}
                                  >
                                    Copiar link
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Projects / Kanban */}
            {section === 'projects' && (
              <div className="mt-6 rounded-3xl border border-zinc-200/70 bg-white/70 backdrop-blur shadow-sm p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Icon name="projects" className="h-5 w-5 text-violet-600" />
                    <div>
                      <div className="font-semibold">Projetos & Kanban</div>
                      <div className="text-xs text-zinc-500">Organize tarefas, dúvidas e notas técnicas em colunas (estilo Jira/Kanban).</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-4">
                  <div className="rounded-3xl border border-zinc-200/70 bg-white p-4">
                    <div className="text-xs font-semibold text-zinc-600">Seus projetos</div>
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <Input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="Nome do projeto" />
                        <Button onClick={createNewProject}>Criar</Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2">
                          <select
                            value={newProjectType}
                            onChange={(e) => setNewProjectType(e.target.value as any)}
                            className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                            title="Tipo do projeto"
                          >
                            <option value="sap">Projeto SAP</option>
                            <option value="general">Projeto Geral</option>
                          </select>
                        </div>
                        <Input
                          value={newProjectHourlyRate}
                          onChange={(e) => setNewProjectHourlyRate(e.target.value)}
                          placeholder="R$/hora (opcional)"
                          title="Valor hora"
                        />
                      </div>
                      <Textarea value={newProjectDesc} onChange={(e) => setNewProjectDesc(e.target.value)} rows={2} placeholder="Descrição (opcional)" />
                    </div>

                    <div className="mt-4 space-y-2">
                      {projects.length === 0 ? (
                        <div className="text-sm text-zinc-500">Crie um projeto para começar.</div>
                      ) : (
                        projects.map((p) => (
                          <div
                            key={p.id}
                            className={cn(
                              'flex items-center justify-between gap-2 rounded-2xl border border-zinc-200/70 px-3 py-2',
                              activeProjectId === p.id ? 'bg-violet-50 border-violet-200' : 'bg-white'
                            )}
                          >
                            <button type="button" className="min-w-0 text-left flex-1" onClick={() => setActiveProjectId(p.id)}>
                              <div className="text-sm font-medium truncate">{p.name}</div>
                              <div className="text-xs text-zinc-500 truncate">
                                Atualizado: {new Date(p.updatedAt).toLocaleDateString()}
                                {!p.isOwner && p.ownerEmail ? ` • Compartilhado por ${p.ownerEmail}` : ''}
                              </div>
                            </button>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {p.isOwner ? (
                                <button
                                  type="button"
                                  className="text-zinc-400 hover:text-violet-700"
                                  onClick={() => {
                                    setProjectShareTarget(p);
                                    setProjectShareEmails('');
                                    setProjectShareSelectedUids([]);
                                    setProjectShareModalOpen(true);
                                  }}
                                  title="Compartilhar"
                                >
                                  <Icon name="share" className="h-4 w-4" />
                                </button>
                              ) : null}
                              {p.isOwner ? (
                                <button
                                  type="button"
                                  className="text-zinc-400 hover:text-red-600"
                                  onClick={() => removeProject(p.id)}
                                  title="Excluir"
                                >
                                  <Icon name="trash" className="h-4 w-4" />
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-4 text-xs text-zinc-500">
                      Dica: use o <b>Drive Explorer</b> para guardar docs do projeto e copie links com 1 clique.
                    </div>
                  </div>

                  {boardFullscreen && (
                    <div
                      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                      onClick={() => setBoardFullscreen(false)}
                    />
                  )}
                  <div className={cn(boardFullscreen ? 'fixed inset-0 z-50 p-3 sm:p-4' : '')}>
                    <div
                      className={cn(
                        'rounded-3xl border border-zinc-200/70 bg-white p-4 overflow-x-auto',
                        boardFullscreen ? 'h-full w-full flex flex-col overflow-hidden shadow-xl' : ''
                      )}
                    >
                    {!activeProjectId ? (
                      <div className="text-sm text-zinc-500">Selecione um projeto.</div>
                    ) : projectBoardLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : !projectBoard ? (
                      <div className="text-sm text-zinc-500">Carregando board...</div>
                    ) : (
                      <div className="rounded-3xl border border-zinc-200/70 bg-white/60 backdrop-blur shadow-sm">
                        <div className="flex items-center justify-between gap-3 p-4 border-b border-zinc-200/60">
                          <div className="min-w-0">
                            <div className="font-semibold truncate">Jira completo (analógico)</div>
                            {activeProject && !activeProject.isOwner && activeProject.ownerEmail ? (
                              <div className="text-xs text-zinc-500 truncate">Compartilhado por {activeProject.ownerEmail}</div>
                            ) : (
                              <div className="text-xs text-zinc-500 truncate">Arraste cards entre colunas • Post-its • Zoom</div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            {(activeProject?.canEdit ?? true) && (
                              <>
                                <Button
                                  variant="secondary"
                                  onClick={() => {
                                    setNewCardTitle('🗒️ Post-it');
                                    setNewCardDesc('');
                                    setNewCardType('note');
                                    setNewCardColor('yellow');
                                    const col = projectBoard.columns[0]?.id ?? 'backlog';
                                    setNewCardColumnId(col);
                                    addKanbanCard(col);
                                  }}
                                >
                                  + Post-it
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={() => {
                                    setNewCardTitle('Nova tarefa');
                                    setNewCardDesc('');
                                    setNewCardType('task');
                                    setNewCardColor('white');
                                    const col = projectBoard.columns[0]?.id ?? 'backlog';
                                    setNewCardColumnId(col);
                                    setNewCardModalOpen(true);
                                  }}
                                >
                                  + Tarefa
                                </Button>
                              </>
                            )}
                            <Button
                              variant="secondary"
                              onClick={() => setBoardZoom((z) => Math.max(0.6, Number((z - 0.1).toFixed(2))))}
                              title="Zoom -"
                            >
                              -
                            </Button>
                            <div className="text-xs text-zinc-600 w-14 text-center">{Math.round(boardZoom * 100)}%</div>
                            <Button
                              variant="secondary"
                              onClick={() => setBoardZoom((z) => Math.min(1.6, Number((z + 0.1).toFixed(2))))}
                              title="Zoom +"
                            >
                              +
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => {
                                const wrap = boardWrapRef.current;
                                if (!wrap) return;
                                const colW = 420;
                                const gap = 24;
                                const pad = 48;
                                const total = projectBoard.columns.length * colW + Math.max(0, projectBoard.columns.length - 1) * gap + pad * 2;
                                const z = Math.min(1.3, Math.max(0.6, Number((wrap.clientWidth / total).toFixed(2))));
                                setBoardZoom(z);
                              }}
                              title="Ajustar ao espaço"
                            >
                              Ajustar
                            </Button>
                            <Button variant="secondary" onClick={() => setBoardZoom(1)} title="Reset">
                              Reset
                            </Button>

                            <Button
                              variant="secondary"
                              onClick={() => setProjectSummaryModal('approved')}
                              title="Ver demandas aprovadas"
                            >
                              Aprovadas
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => setProjectSummaryModal('finalized')}
                              title="Ver demandas finalizadas"
                            >
                              Finalizadas
                            </Button>
                          
                            <Button
                              variant="secondary"
                              onClick={() => setBoardFullscreen((v) => !v)}
                              title="Tela cheia"
                            >
                              {boardFullscreen ? 'Sair tela cheia' : 'Tela cheia'}
                            </Button>
</div>
                        </div>

                        <div
                          ref={boardWrapRef}
                          onWheel={handleBoardWheel}
                          className={cn(
                            'relative overflow-auto rounded-b-3xl min-h-[560px]',
                            boardFullscreen ? 'h-[calc(100vh-190px)]' : 'h-[calc(100vh-320px)]'
                          )}
                          style={{
                            background:
                              "radial-gradient(ellipse at top, rgba(255,255,255,0.55), rgba(0,0,0,0)) , repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 12px, rgba(0,0,0,0.03) 12px, rgba(0,0,0,0.03) 24px), linear-gradient(180deg, #2b2b2b 0%, #1f1f1f 100%)",
                          }}
                        >
                          <div
                            className="flex gap-6 p-12 w-fit"
                            style={{ transform: `scale(${boardZoom})`, transformOrigin: '0 0' }}
                          >
                            {projectBoard.columns.map((col) => {
                              const cards = projectBoard.cards
                                .filter((c) => c.columnId === col.id)
                                .sort((a, b) => (Number(a.order ?? 0) || 0) - (Number(b.order ?? 0) || 0));

                              const isOver = dragOverColumnId === col.id;
                              const wipLimit = col.wipLimit ?? null;
                              const wipExceeded = wipLimit != null && wipLimit > 0 && cards.length > wipLimit;

                              return (
                                <div
                                  key={col.id}
                                  className={cn(
                                    'w-[420px] shrink-0 rounded-3xl border border-white/10 bg-white/10 backdrop-blur p-4 shadow-sm',
                                    isOver ? 'ring-2 ring-violet-400' : ''
                                  )}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOverColumnId(col.id);
                                  }}
                                  onDragLeave={() => setDragOverColumnId(null)}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const id = e.dataTransfer.getData('text/plain');
                                    if (id) dropCardToColumn(id, col.id);
                                    setDragOverColumnId(null);
                                    setDragOverCardId(null);
                                  }}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold text-white truncate">{col.title}</div>
                                      <div className={cn('text-xs mt-1', wipExceeded ? 'text-red-200' : 'text-white/70')}>
                                        {cards.length}
                                        {wipLimit ? ` / ${wipLimit} (WIP)` : ''}
                                      </div>
                                    </div>

                                    {activeProject?.isOwner ? (
                                      <div className="flex items-center gap-2">
                                        <div className="text-[11px] text-white/70">WIP</div>
                                        <input
                                          type="number"
                                          min={0}
                                          value={col.wipLimit ?? ''}
                                          onChange={(e) => {
                                            const v = e.target.value === '' ? null : Math.max(0, Number(e.target.value));
                                            const next: ProjectBoard = {
                                              ...projectBoard,
                                              columns: projectBoard.columns.map((cc) => (cc.id === col.id ? { ...cc, wipLimit: v } : cc)),
                                            };
                                            setBoardAndScheduleSave(next);
                                          }}
                                          className="w-16 rounded-xl border border-white/20 bg-white/10 px-2 py-1 text-xs text-white outline-none"
                                          title="Limite de WIP (0 = sem limite)"
                                        />
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="mt-4 space-y-4">
                                    {cards.length === 0 ? (
                                      <div className="text-xs text-white/60">Solte um card aqui.</div>
                                    ) : null}

                                    {cards.map((c) => {
                                      const angle = postitAngle(c.id);
                                      const isOverCard = dragOverCardId === c.id;
                                      const color = (c.color ?? 'yellow') as any;
                                      const bg =
                                        color === 'blue'
                                          ? 'bg-sky-100'
                                          : color === 'green'
                                          ? 'bg-emerald-100'
                                          : color === 'pink'
                                          ? 'bg-pink-100'
                                          : color === 'white'
                                          ? 'bg-white'
                                          : 'bg-yellow-100';

                                      return (
                                        <div
                                          key={c.id}
                                          draggable
                                          onDragStart={(e) => {
                                            setDraggingCardId(c.id);
                                            e.dataTransfer.setData('text/plain', c.id);
                                            e.dataTransfer.effectAllowed = 'move';
                                          }}
                                          onDragEnd={() => {
                                            setDraggingCardId(null);
                                            setDragOverColumnId(null);
                                            setDragOverCardId(null);
                                          }}
                                          onDragOver={(e) => {
                                            e.preventDefault();
                                            setDragOverCardId(c.id);
                                          }}
                                          onDrop={(e) => {
                                            e.preventDefault();
                                            const id = e.dataTransfer.getData('text/plain');
                                            if (id) dropCardToColumn(id, col.id, c.id);
                                            setDragOverCardId(null);
                                            setDragOverColumnId(null);
                                          }}
                                          onClick={() => openCard(c)}
                                          className={cn(
                                            'cursor-pointer rounded-2xl border border-zinc-200/70 p-4 shadow-[0_10px_25px_rgba(0,0,0,0.35)]',
                                            bg,
                                            isOverCard ? 'ring-2 ring-violet-500' : ''
                                          )}
                                          style={{ transform: `rotate(${angle}deg)` }}
                                          title="Clique para editar"
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                              <div className="font-semibold text-sm truncate text-zinc-900">{c.title}</div>
                                              {c.description ? (
                                                <div className="mt-1 text-xs text-zinc-700 whitespace-pre-wrap line-clamp-4">{c.description}</div>
                                              ) : null}
                                            </div>
                                            <button
                                              type="button"
                                              className="text-zinc-400 hover:text-red-600 flex-shrink-0"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                deleteKanbanCard(c.id);
                                              }}
                                              title="Excluir"
                                            >
                                              <Icon name="trash" className="h-4 w-4" />
                                            </button>
                                          </div>

                                          <div className="mt-3 flex flex-wrap items-center gap-2">
                                            {c.priority ? (
                                              <span className="text-[11px] px-2 py-1 rounded-full bg-zinc-900/5 text-zinc-700">
                                                {c.priority === 'urgent'
                                                  ? 'URG'
                                                  : c.priority === 'high'
                                                  ? 'ALTA'
                                                  : c.priority === 'med'
                                                  ? 'MÉD'
                                                  : 'BAIX'}
                                              </span>
                                            ) : null}
                                            {c.dueDate ? (
                                              <span className="text-[11px] px-2 py-1 rounded-full bg-zinc-900/5 text-zinc-700">📅 {c.dueDate}</span>
                                            ) : null}
                                            {c.checklist && c.checklist.length ? (
                                              <span className="text-[11px] px-2 py-1 rounded-full bg-zinc-900/5 text-zinc-700">
                                                ☑ {c.checklist.filter((x) => x.done).length}/{c.checklist.length}
                                              </span>
                                            ) : null}
                                            {c.estimateHours != null ? (
                                              <span className="text-[11px] px-2 py-1 rounded-full bg-zinc-900/5 text-zinc-700">⏱ {c.estimateHours}h</span>
                                            ) : null}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-3">
                                    <div className="text-xs font-semibold text-white/80">Novo post-it</div>
                                    <div className="mt-2 space-y-2">
                                      <Input
                                        value={newCardTitle}
                                        onChange={(e) => setNewCardTitle(e.target.value)}
                                        placeholder="Título"
                                      />
                                      <Textarea
                                        value={newCardDesc}
                                        onChange={(e) => setNewCardDesc(e.target.value)}
                                        rows={2}
                                        placeholder="Descrição (opcional)"
                                      />
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="secondary"
                                          onClick={() => {
                                            setNewCardType('task');
                                            setNewCardColor('white');
                                            addKanbanCard(col.id);
                                          }}
                                        >
                                          Adicionar
                                        </Button>
                                        <Button
                                          variant="secondary"
                                          onClick={() => {
                                            // Quick reminder template
                                            setNewCardTitle('Lembrete');
                                            setNewCardDesc('- [ ] ...');
                                          }}
                                          title="Template checklist"
                                        >
                                          Template
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {section === 'notes' && (
              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-zinc-200/70 bg-white/70 backdrop-blur shadow-sm p-5">
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

                <div className="rounded-3xl border border-zinc-200/70 bg-white/70 backdrop-blur shadow-sm p-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="font-semibold">Notas (cards)</div>
                      <div className="text-xs text-zinc-500">Crie notas nomeadas com data, busque pelo nome ou conteúdo e use como referência de projeto.</div>
                    </div>
                    <Button onClick={() => { setEditingNote(null); setNoteModalOpen(true); setNoteForm({ title: '', content: '' }); }}>Nova nota</Button>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <div className="relative flex-1">
                      <Icon name="search" className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input value={noteQuery} onChange={(e) => setNoteQuery(e.target.value)} placeholder="Buscar nota..." className="pl-9 bg-white/90" />
                    </div>
                    <Button variant="secondary" onClick={() => setNoteQuery('')}>Limpar</Button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(noteItems
                      .filter((n) => {
                        const q = noteQuery.trim().toLowerCase();
                        if (!q) return true;
                        return (n.title ?? '').toLowerCase().includes(q) || (n.content ?? '').toLowerCase().includes(q);
                      })
                      .sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt))
                    ).map((n) => (
                      <div key={n.id} className="rounded-2xl border border-zinc-200/70 bg-white p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-sm">{n.title}</div>
                            <div className="text-[11px] text-zinc-500">{new Date(n.updatedAt ?? n.createdAt).toLocaleString()}</div>
                          </div>
                          <div className="flex gap-1">
                            <IconActionButton icon="copy" title="Copiar conteúdo" onClick={() => copyText(n.content)} />
                            <IconActionButton icon="edit" title="Editar" onClick={() => { setEditingNote(n); setNoteForm({ title: n.title, content: n.content }); setNoteModalOpen(true); }} />
                            <IconActionButton
                              icon="trash"
                              title="Excluir"
                              onClick={async () => {
                                if (!confirm('Excluir esta nota?')) return;
                                try {
                                  await deleteNoteItem(n.id);
                                  setNoteItems((p) => p.filter((x) => x.id !== n.id));
                                } catch {
                                  push('Falha ao excluir nota', 'error');
                                }
                              }}
                            />
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-zinc-700 whitespace-pre-wrap line-clamp-5">{n.content}</div>
                      </div>
                    ))}
                    {noteItems.length === 0 && (
                      <div className="text-sm text-zinc-500">Nenhuma nota criada ainda.</div>
                    )}
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
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600">Tipo de credencial</label>
            <select
              value={(form as any).entryType}
              onChange={(e) => setForm((p: any) => ({ ...p, entryType: e.target.value }))}
              className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            >
              <option value="generic">Genérica</option>
              <option value="website">Site {'/'} Login Web</option>
              <option value="sap">Conexão SAP</option>
              <option value="vpn">Conexão VPN</option>
              <option value="json">JSON {'/'} ENV {'/'} App</option>
            </select>
            <div className="mt-1 text-[11px] text-zinc-500">
              O formulário se adapta ao tipo escolhido para ficar mais clean.
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600">Serviço {'/'} Nome</label>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ex.: AWS Console" />
          </div>
          {(['generic','website'].includes((form as any).entryType)) && (
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600">URL (opcional)</label>
            <div className="flex gap-2">
              <Input value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="Ex.: https://..." />
              <Button
                type="button"
                variant="secondary"
                onClick={() => copyText(form.url)}
                disabled={!form.url.trim()}
                title="Copiar"
              >
                <Icon name="copy" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
	        {((form as any).entryType !== 'json') && (
	          <>
	            <div>
	              <label className="text-xs font-medium text-zinc-600">Usuário</label>
	              <Input
	                value={form.username}
	                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
	                placeholder="Ex.: root"
	              />
	            </div>

	            <div>
	              <label className="text-xs font-medium text-zinc-600">Senha</label>
	              <Input
	                value={form.password}
	                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
	                placeholder="••••••••"
	              />
	            </div>
	          </>
	        )}
          {((form as any).entryType === 'generic') && (
          <div>
            <label className="text-xs font-medium text-zinc-600">IP {'/'} Host</label>
            <Input value={form.ip} onChange={(e) => setForm((p) => ({ ...p, ip: e.target.value }))} placeholder="Ex.: 10.0.0.10" />
          </div>
          )}
          {((form as any).entryType === 'generic') && (
          <div>
            <label className="text-xs font-medium text-zinc-600">E-mail vinculado</label>
            <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Ex.: admin@empresa.com" />
          </div>
          )}
          {((form as any).entryType === 'sap') && (
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-medium text-zinc-600">Conexão SAP (campos)</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => copyText(JSON.stringify(sapConn, null, 2))}
                  title="Copiar JSON"
                >
                  <Icon name="copy" className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-zinc-500">Application Server</label>
                <div className="flex gap-2">
                  <Input value={sapConn.applicationServer} onChange={(e) => setSapConn((p) => ({ ...p, applicationServer: e.target.value }))} placeholder="ex.: 10.0.0.10" />
                  <Button type="button" variant="secondary" onClick={() => copyText(sapConn.applicationServer)} disabled={!sapConn.applicationServer.trim()} title="Copiar"><Icon name="copy" className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-zinc-500">Instância</label>
                <div className="flex gap-2">
                  <Input value={sapConn.instanceNumber} onChange={(e) => setSapConn((p) => ({ ...p, instanceNumber: e.target.value }))} placeholder="ex.: 00" />
                  <Button type="button" variant="secondary" onClick={() => copyText(sapConn.instanceNumber)} disabled={!sapConn.instanceNumber.trim()} title="Copiar"><Icon name="copy" className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-zinc-500">SID</label>
                <div className="flex gap-2">
                  <Input value={sapConn.systemId} onChange={(e) => setSapConn((p) => ({ ...p, systemId: e.target.value.toUpperCase() }))} placeholder="ex.: PRD" />
                  <Button type="button" variant="secondary" onClick={() => copyText(sapConn.systemId)} disabled={!sapConn.systemId.trim()} title="Copiar"><Icon name="copy" className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-zinc-500">Client</label>
                <div className="flex gap-2">
                  <Input value={sapConn.client} onChange={(e) => setSapConn((p) => ({ ...p, client: e.target.value }))} placeholder="ex.: 100" />
                  <Button type="button" variant="secondary" onClick={() => copyText(sapConn.client)} disabled={!sapConn.client.trim()} title="Copiar"><Icon name="copy" className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-zinc-500">Idioma</label>
                <div className="flex gap-2">
                  <Input value={sapConn.language} onChange={(e) => setSapConn((p) => ({ ...p, language: e.target.value }))} placeholder="ex.: PT" />
                  <Button type="button" variant="secondary" onClick={() => copyText(sapConn.language)} disabled={!sapConn.language.trim()} title="Copiar"><Icon name="copy" className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-zinc-500">SNC Name (opcional)</label>
                <div className="flex gap-2">
                  <Input value={sapConn.sncName} onChange={(e) => setSapConn((p) => ({ ...p, sncName: e.target.value }))} placeholder="ex.: p:CN=..." />
                  <Button type="button" variant="secondary" onClick={() => copyText(sapConn.sncName)} disabled={!sapConn.sncName.trim()} title="Copiar"><Icon name="copy" className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="sm:col-span-3">
                <label className="text-[11px] text-zinc-500">Cadeia SAProuter</label>
                <div className="flex gap-2">
                  <Textarea value={sapConn.sapRouter} onChange={(e) => setSapConn((p) => ({ ...p, sapRouter: e.target.value }))} rows={2} placeholder="/H/1.2.3.4/H/..." />
                  <Button type="button" variant="secondary" onClick={() => copyText(sapConn.sapRouter)} disabled={!sapConn.sapRouter.trim()} title="Copiar"><Icon name="copy" className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-zinc-500">Message Server</label>
                <div className="flex gap-2">
                  <Input value={sapConn.messageServer} onChange={(e) => setSapConn((p) => ({ ...p, messageServer: e.target.value }))} placeholder="ex.: msg01" />
                  <Button type="button" variant="secondary" onClick={() => copyText(sapConn.messageServer)} disabled={!sapConn.messageServer.trim()} title="Copiar"><Icon name="copy" className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] text-zinc-500">Logon Group</label>
                <div className="flex gap-2">
                  <Input value={sapConn.logonGroup} onChange={(e) => setSapConn((p) => ({ ...p, logonGroup: e.target.value }))} placeholder="ex.: PUBLIC" />
                  <Button type="button" variant="secondary" onClick={() => copyText(sapConn.logonGroup)} disabled={!sapConn.logonGroup.trim()} title="Copiar"><Icon name="copy" className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </div>
          )}
          
          {((form as any).entryType === 'vpn') && (
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-medium text-zinc-600">Conexão VPN (campos)</label>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => copyText(JSON.stringify(vpnConn, null, 2))}
                  title="Copiar JSON"
                >
                  <Icon name="copy" className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-500">Provider</label>
                  <div className="flex gap-2">
                    <Input value={vpnConn.provider} onChange={(e) => setVpnConn((p) => ({ ...p, provider: e.target.value }))} placeholder="ex.: FortiClient" />
                    <Button type="button" variant="secondary" onClick={() => copyText(vpnConn.provider)} disabled={!vpnConn.provider.trim()} title="Copiar">
                      <Icon name="copy" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] text-zinc-500">Server {'/'} Gateway</label>
                  <div className="flex gap-2">
                    <Input value={vpnConn.server} onChange={(e) => setVpnConn((p) => ({ ...p, server: e.target.value }))} placeholder="ex.: vpn.empresa.com" />
                    <Button type="button" variant="secondary" onClick={() => copyText(vpnConn.server)} disabled={!vpnConn.server.trim()} title="Copiar">
                      <Icon name="copy" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-500">Port</label>
                  <div className="flex gap-2">
                    <Input value={vpnConn.port} onChange={(e) => setVpnConn((p) => ({ ...p, port: e.target.value }))} placeholder="ex.: 443" />
                    <Button type="button" variant="secondary" onClick={() => copyText(vpnConn.port)} disabled={!vpnConn.port.trim()} title="Copiar">
                      <Icon name="copy" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-500">Protocol</label>
                  <div className="flex gap-2">
                    <Input value={vpnConn.protocol} onChange={(e) => setVpnConn((p) => ({ ...p, protocol: e.target.value }))} placeholder="ex.: SSL-VPN" />
                    <Button type="button" variant="secondary" onClick={() => copyText(vpnConn.protocol)} disabled={!vpnConn.protocol.trim()} title="Copiar">
                      <Icon name="copy" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-500">Username</label>
                  <div className="flex gap-2">
                    <Input value={vpnConn.username} onChange={(e) => setVpnConn((p) => ({ ...p, username: e.target.value }))} placeholder="ex.: rafael" />
                    <Button type="button" variant="secondary" onClick={() => copyText(vpnConn.username)} disabled={!vpnConn.username.trim()} title="Copiar">
                      <Icon name="copy" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-500">Domain {'/'} Realm</label>
                  <div className="flex gap-2">
                    <Input value={vpnConn.domain} onChange={(e) => setVpnConn((p) => ({ ...p, domain: e.target.value }))} placeholder="ex.: AD" />
                    <Button type="button" variant="secondary" onClick={() => copyText(vpnConn.domain)} disabled={!vpnConn.domain.trim()} title="Copiar">
                      <Icon name="copy" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] text-zinc-500">Profile {'/'} Observações</label>
                  <div className="flex gap-2">
                    <Textarea value={vpnConn.profile} onChange={(e) => setVpnConn((p) => ({ ...p, profile: e.target.value }))} rows={2} placeholder="ex.: profile name / split tunneling / etc" />
                    <Button type="button" variant="secondary" onClick={() => copyText(vpnConn.profile)} disabled={!vpnConn.profile.trim()} title="Copiar">
                      <Icon name="copy" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] text-zinc-500">Notas VPN</label>
                  <Textarea value={vpnConn.notes} onChange={(e) => setVpnConn((p) => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Tokens, certificados, passos..." />
                </div>
              </div>
            </div>
          )}

          {((form as any).entryType !== 'website') && (
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-medium text-zinc-600">Dados gerais {'/'} JSON (env, configs, apps)</label>
                <Button type="button" variant="secondary" onClick={() => copyText(metaJsonText)} disabled={!metaJsonText.trim()} title="Copiar">
                  <Icon name="copy" className="h-4 w-4" />
                </Button>
              </div>

              <Textarea
                value={metaJsonText}
                onChange={(e) => setMetaJsonText(e.target.value)}
                rows={4}
                placeholder={'Cole um JSON (ex.: {"env": {"API_URL": "..."}, "urls": [...]}) ou texto livre'}
              />

              <div className="mt-1 text-[11px] text-zinc-500">
                Dica: se você colar um JSON válido aqui, o sistema salva estruturado e facilita filtros no futuro.
              </div>
            </div>
          )}

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
                    <Button type="button" variant="secondary" onClick={() => copyText(String(value))} title="Copiar">
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
                  <Button type="button" variant="secondary" onClick={() => copyText(JSON.stringify(obj, null, 2))} title="Copiar JSON">
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
                      <Button type="button" variant="secondary" onClick={() => copyText(String(pass))} disabled={!pass} title="Copiar senha">
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
            <label className="text-xs font-medium text-zinc-600">Escopo</label>
            <select
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
                <label className="text-xs font-medium text-zinc-600">Prioridade</label>
                <select
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
                <label className="text-xs font-medium text-zinc-600">Coluna</label>
                <select
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
