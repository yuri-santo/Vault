import React, { useMemo, useState } from 'react';
import { Plus, Share2, Trash2, Loader2, CheckCircle2, KanbanSquare, Search, X } from '../../components/icons';
import type { Project } from '../../lib/api';

type CardColor = 'yellow' | 'blue' | 'green' | 'pink' | 'white';

type BoardColumn = {
  id: string;
  title: string;
  order?: number;
};

type BoardCard = {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  color?: CardColor;
  order?: number;
  projectId?: string;
  projectName?: string;
  canEdit?: boolean;
};

type ProjectBoard = {
  columns: BoardColumn[];
  cards: BoardCard[];
};

type Props = {
  projects: Project[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;

  // CRUD de projetos
  newProjectName: string;
  setNewProjectName: (v: string) => void;
  newProjectDesc: string;
  setNewProjectDesc: (v: string) => void;
  createNewProject: () => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  creatingProject: boolean;
  deletingProjectId: string | null;

  // Compartilhamento (modal Ã© renderizado no Dashboard)
  setProjectShareTarget: (p: Project | null) => void;
  setProjectShareOpen: (v: boolean) => void;

  // Kanban
  projectBoard: ProjectBoard | null;
  projectBoardLoading: boolean;
  boardSaving: boolean;
  newColumnTitle: string;
  setNewColumnTitle: (v: string) => void;
  addKanbanColumn: () => Promise<void>;
  addingColumn: boolean;

  newCardTitle: string;
  setNewCardTitle: (v: string) => void;
  newCardDesc: string;
  setNewCardDesc: (v: string) => void;
  newCardColor: CardColor;
  setNewCardColor: React.Dispatch<React.SetStateAction<CardColor>>;
  newCardProjectId: string;
  setNewCardProjectId: (v: string) => void;
  addKanbanCard: (columnId: string, projectId: string) => Promise<void>;
  addingCardToColumn: string | null;

  draggingCardId: string | null;
  setDraggingCardId: (v: string | null) => void;
  dropCardToColumn: (cardId: string, columnId: string, projectId?: string | null) => Promise<void>;
  deleteKanbanCard: (cardId: string, projectId?: string | null) => Promise<void>;

  // Modal de card (renderizado no Dashboard)
  openCard: (cardId: string, projectId?: string | null) => void;
};

function sortColumns(cols: BoardColumn[]): BoardColumn[] {
  const cloned = [...cols];
  cloned.sort((a, b) => {
    const ao = typeof a.order === 'number' ? a.order : 999;
    const bo = typeof b.order === 'number' ? b.order : 999;
    return ao - bo;
  });

  // garante "Concluídos" por Ãºltimo
  const doneIdx = cloned.findIndex((c) => c.id === 'done');
  if (doneIdx >= 0) {
    const [done] = cloned.splice(doneIdx, 1);
    cloned.push({ ...done, title: done.title || 'Concluídos' });
  }
  return cloned;
}

function sortCards(cards: BoardCard[]): BoardCard[] {
  const cloned = [...cards];
  cloned.sort((a, b) => {
    const ao = typeof a.order === 'number' ? a.order : 999;
    const bo = typeof b.order === 'number' ? b.order : 999;
    return ao - bo;
  });
  return cloned;
}

const COLOR_BADGES: Record<CardColor, string> = {
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-emerald-100 text-emerald-800',
  pink: 'bg-pink-100 text-pink-800',
  white: 'bg-slate-100 text-slate-700',
};

export default function ProjectsSection(props: Props) {
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    newProjectName,
    setNewProjectName,
    newProjectDesc,
    setNewProjectDesc,
    createNewProject,
    removeProject,
    creatingProject,
    deletingProjectId,
    setProjectShareTarget,
    setProjectShareOpen,
    projectBoard,
    projectBoardLoading,
    boardSaving,
    newColumnTitle,
    setNewColumnTitle,
    addKanbanColumn,
    addingColumn,
    newCardTitle,
    setNewCardTitle,
    newCardDesc,
    setNewCardDesc,
    newCardColor,
    setNewCardColor,
    newCardProjectId,
    setNewCardProjectId,
    addKanbanCard,
    addingCardToColumn,
    draggingCardId,
    setDraggingCardId,
    dropCardToColumn,
    deleteKanbanCard,
    openCard,
  } = props;

  const [projectSearch, setProjectSearch] = useState('');

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || null,
    [projects, activeProjectId]
  );

  const filteredProjects = useMemo(() => {
    // Defensive: avoid runtime errors if some input/component ever passes undefined/null
    const q = (projectSearch ?? '').trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => {
      const t = (p.name || '').toLowerCase();
      const d = (p.description || '').toLowerCase();
      return t.includes(q) || d.includes(q);
    });
  }, [projects, projectSearch]);

  const columns = useMemo(() => (projectBoard ? sortColumns(projectBoard.columns) : []), [projectBoard]);
  const cards = useMemo(() => (projectBoard ? sortCards(projectBoard.cards) : []), [projectBoard]);

  const cardsByColumn = useMemo(() => {
    const map: Record<string, BoardCard[]> = {};
    for (const c of cards) {
      if (!map[c.columnId]) map[c.columnId] = [];
      map[c.columnId].push(c);
    }
    for (const k of Object.keys(map)) {
      map[k] = sortCards(map[k]);
    }
    return map;
  }, [cards]);
  const onDragStart = (e: React.DragEvent, cardId: string, projectId?: string | null) => {
    const payload = JSON.stringify({ cardId, projectId: projectId ?? null });
    e.dataTransfer.setData('text/plain', payload);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingCardId(cardId);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    let cardId = '';
    let projectId: string | null = null;
    try {
      const parsed = JSON.parse(raw);
      cardId = parsed?.cardId ?? '';
      projectId = parsed?.projectId ?? null;
    } catch {
      cardId = raw;
    }
    setDraggingCardId(null);
    if (!cardId) return;
    await dropCardToColumn(cardId, columnId, projectId);
  };

  const isBusy = creatingProject || projectBoardLoading || boardSaving;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <KanbanSquare size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 leading-tight">Projetos</h2>
            <p className="text-xs text-slate-500">Todos os cards de todos os projetos em um unico Kanban.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeProject && (
            <button
              type="button"
              onClick={() => {
                setProjectShareTarget(activeProject);
                setProjectShareOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98]"
              title="Compartilhar projeto"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">Compartilhar</span>
            </button>
          )}

          {activeProject && (
            <button
              type="button"
              onClick={() => removeProject(activeProject.id)}
              disabled={!!deletingProjectId}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:opacity-60 active:scale-[0.98]"
              title="Excluir projeto"
            >
              {deletingProjectId === activeProject.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              <span className="hidden sm:inline">Excluir</span>
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-0">
        {/* Left panel: projects list + create */}
        <div className="border-b lg:border-b-0 lg:border-r border-slate-100 bg-white">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value ?? '')}
                placeholder="Buscar projetos..."
                className="w-full pl-9 pr-9 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Buscar projetos"
              />
              {!!(projectSearch ?? '').trim() && (
                <button
                  type="button"
                  onClick={() => setProjectSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-200"
                  aria-label="Limpar busca"
                >
                  <X size={14} className="text-slate-500" />
                </button>
              )}
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-800">Novo projeto</h3>
                <span className="text-[11px] text-slate-500">Kanban</span>
              </div>
              <input
                value={newProjectName}
                onChange={(e) => setnewProjectName(e.target.value)}
                placeholder="Nome do projeto"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Nome do projeto"
              />
              <textarea
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="Descrição (opcional)"
                className="w-full mt-2 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                aria-label="Descrição do projeto"
              />

              <div className="flex items-center justify-between gap-2 mt-3"><button
                  type="button"
                  onClick={createNewProject}
                  disabled={!(newProjectName ?? '').trim() || creatingProject}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 active:scale-[0.98]"
                >
                  {creatingProject ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Criar
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-800">Seus projetos</h3>
                <span className="text-xs text-slate-500">{projects.length}</span>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                {filteredProjects.length === 0 ? (
                  <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    Nenhum projeto encontrado.
                  </div>
                ) : (
                  filteredProjects.map((p) => {
                    const isActive = p.id === activeProjectId;
                    const sharedBadge = p.canEdit ? null : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Compartilhado</span>
                    );
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setActiveProjectId(p.id)}
                        className={`w-full text-left rounded-xl border px-3 py-2 transition-all active:scale-[0.99] ${
                          isActive
                            ? 'border-blue-300 bg-blue-50 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-800 truncate">{p.name}</span>
                              {sharedBadge}
                            </div>
                            {p.description ? (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                            ) : (
                              <p className="text-xs text-slate-400 mt-1">Sem Descrição</p>
                            )}
                          </div>
                          {isActive && <CheckCircle2 size={18} className="text-blue-600 shrink-0" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right panel: kanban */}
        <div className="bg-[#F4F5F7]">
          <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 truncate">
                {activeProject ? `Selecionado para acoes: ${activeProject.name}` : 'Selecione um projeto na lista'}
              </h3>
              <p className="text-xs text-slate-500">
                {activeProject
                  ? activeProject.canEdit
                    ? 'Voce pode editar este projeto.'
                    : 'Voce tem acesso de leitura (compartilhado).'
                  : 'A lista serve para compartilhar ou excluir projetos.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {boardSaving && (
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <Loader2 size={14} className="animate-spin" /> Salvando...
                </div>
              )}

              {/* Add column */}
              <div className="hidden md:flex items-center gap-2">
                <input
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  placeholder="Nova coluna"
                  className="w-44 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Titulo da nova coluna"
                  disabled={isBusy}
                />
                <button
                  type="button"
                  onClick={addKanbanColumn}
                  disabled={!(newColumnTitle ?? "").trim() || addingColumn}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 active:scale-[0.98]"
                >
                  {addingColumn ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Coluna
                </button>
              </div>
            </div>
          </div>

          <div className="p-5">
            {projectBoardLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 flex items-center justify-center gap-3 text-slate-600">
                <Loader2 className="animate-spin" /> Carregando quadro...
              </div>
            ) : !projectBoard ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
                Nao foi possivel carregar o quadro.
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {columns.map((col) => (
                  <div
                    key={col.id}
                    className="w-[340px] shrink-0 rounded-2xl bg-[#EBECF0] border border-slate-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, col.id)}
                  >
                    <div className="p-4 border-b border-slate-200 bg-[#F4F5F7] rounded-t-2xl flex items-center justify-between sticky top-0">
                      <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">{col.id === 'done' ? 'Concluídos' : col.title}</span>
                      <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded-full">
                        {(cardsByColumn[col.id] || []).length}
                      </span>
                    </div>

                    <div className="p-3 space-y-3 min-h-[120px]">
                      {(cardsByColumn[col.id] || []).map((card) => (
                        <div
                          key={`${card.projectId || 'p'}_${card.id}`}
                          draggable={card.canEdit !== false}
                          onDragStart={(e) => onDragStart(e, card.id, card.projectId)}
                          onDragEnd={() => setDraggingCardId(null)}
                          onClick={() => openCard(card.id, card.projectId)}
                          className={`group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer select-none active:scale-[0.99] ${
                            draggingCardId === card.id ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="p-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-mono text-slate-400">{card.id}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${COLOR_BADGES[card.color || 'white']}`}>{
                                card.color || 'white'
                              }</span>
                            </div>
                            {card.projectName ? (
                              <div className="mt-1 text-[11px] text-slate-500 truncate">Projeto: {card.projectName}</div>
                            ) : null}
                            <h4 className="mt-2 text-sm font-semibold text-slate-800 leading-snug line-clamp-2">{card.title}</h4>
                            {card.description ? (
                              <p className="mt-1 text-xs text-slate-500 line-clamp-3 whitespace-pre-wrap">{card.description}</p>
                            ) : null}
                          </div>
                          {card.canEdit !== false && (
                            <div className="px-3 pb-3 flex justify-end">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteKanbanCard(card.id, card.projectId);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-800"
                                title="Excluir card"
                              >
                                <Trash2 size={14} /> Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {(cardsByColumn[col.id] || []).length === 0 ? (
                        <div className="h-28 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-sm">
                          Solte aqui
                        </div>
                      ) : null}
                    </div>

                    {/* Add card */}
                    <div className="p-3 border-t border-slate-200 bg-[#F4F5F7] rounded-b-2xl">
                      <div className="space-y-2">
                        <select
                          value={newCardProjectId}
                          onChange={(e) => setNewCardProjectId(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="Projeto do card"
                          disabled={isBusy}
                        >
                          <option value="">Selecione o projeto do card</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id} disabled={!p.canEdit}>
                              {p.name}
                              {!p.canEdit ? ' (somente leitura)' : ''}
                            </option>
                          ))}
                        </select>
                        <input
                          value={newCardTitle}
                          onChange={(e) => setNewCardTitle(e.target.value)}
                          placeholder="Titulo do card"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="Titulo do card"
                          disabled={isBusy}
                        />
                        <textarea
                          value={newCardDesc}
                          onChange={(e) => setNewCardDesc(e.target.value)}
                          placeholder="Descrição (opcional)"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={2}
                          aria-label="Descrição do card"
                          disabled={isBusy}
                        />
                        <div className="flex items-center justify-between gap-2">
                          <select
                            value={newCardColor}
                            onChange={(e) => setNewCardColor(e.target.value as CardColor)}
                            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Cor do card"
                            disabled={isBusy}
                          >
                            <option value="white">Branco</option>
                            <option value="yellow">Amarelo</option>
                            <option value="blue">Azul</option>
                            <option value="green">Verde</option>
                            <option value="pink">Rosa</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => addKanbanCard(col.id, newCardProjectId)}
                            disabled={!newCardProjectId || !(newCardTitle ?? "").trim() || addingCardToColumn === col.id}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 active:scale-[0.98]"
                          >
                            {addingCardToColumn === col.id ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Card
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* hint */}
                <div className="w-20 shrink-0" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
