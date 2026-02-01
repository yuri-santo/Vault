import React, { useEffect, useMemo, useState } from 'react';
import type { Project, ProjectBoard } from '../../lib/api';
import { Button, Input, Textarea } from '../../components/ui';

export type CardColor = 'yellow' | 'blue' | 'green' | 'pink' | 'white';

type Props = {
  projects: Project[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string) => void;

  // create project
  newProjectName: string;
  setNewProjectName: (v: string) => void;
  newProjectDesc: string;
  setNewProjectDesc: (v: string) => void;
  newProjectType: 'tarefa' | 'projeto';
  setNewProjectType: (v: 'tarefa' | 'projeto') => void;
  newProjectHourlyRate: string;
  setNewProjectHourlyRate: (v: string) => void;
  creatingProject: boolean;
  createNewProject: () => Promise<void>;
  removeProject: (projectId: string) => Promise<void>;

  // sharing
  setProjectShareTarget: (p: Project) => void;
  setProjectShareOpen: (v: boolean) => void;

  // kanban
  projectBoard: ProjectBoard | null;
  projectBoardLoading: boolean;

  newColumnTitle: string;
  setNewColumnTitle: (v: string) => void;
  addKanbanColumn: () => Promise<void>;

  newCardTitle: string;
  setNewCardTitle: (v: string) => void;
  newCardDesc: string;
  setNewCardDesc: (v: string) => void;
  newCardColor: CardColor;
  setNewCardColor: React.Dispatch<React.SetStateAction<CardColor>>;
  addKanbanCard: (columnId: string) => Promise<void>;

  openCard: (card: any) => void;
  deleteKanbanCard: (columnId: string, cardId: string) => Promise<void>;
  moveKanbanCard: (fromColumnId: string, toColumnId: string, cardId: string) => Promise<void>;
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
    newProjectType,
    setNewProjectType,
    newProjectHourlyRate,
    setNewProjectHourlyRate,
    creatingProject,
    createNewProject,
    removeProject,
    setProjectShareTarget,
    setProjectShareOpen,
    projectBoard,
    projectBoardLoading,
    newColumnTitle,
    setNewColumnTitle,
    addKanbanColumn,
    newCardTitle,
    setNewCardTitle,
    newCardDesc,
    setNewCardDesc,
    newCardColor,
    setNewCardColor,
    addKanbanCard,
    openCard,
    deleteKanbanCard,
    moveKanbanCard,
  } = props;

  const activeProject = useMemo(() => projects.find((p) => p.id === activeProjectId) || null, [projects, activeProjectId]);
  const columns = projectBoard?.columns ?? [];

  const [newCardColumnId, setNewCardColumnId] = useState<string>('');

  useEffect(() => {
    // keep selection sane when project/board changes
    if (!newCardColumnId && columns.length) setNewCardColumnId(columns[0].id);
    if (newCardColumnId && columns.length && !columns.some((c) => c.id === newCardColumnId)) {
      setNewCardColumnId(columns[0].id);
    }
  }, [columns, newCardColumnId]);

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-lg font-semibold">Projetos & Kanban</div>
            <div className="text-sm text-white/60">Crie e organize suas tarefas por colunas.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                if (!projects.length) return;
                const first = projects[0];
                setActiveProjectId(first.id);
              }}
            >
              Selecionar 1º projeto
            </Button>
          </div>
        </div>

        {/* Create project */}
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <Input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="Nome do projeto" />
          <Input value={newProjectHourlyRate} onChange={(e) => setNewProjectHourlyRate(e.target.value)} placeholder="R$/hora (opcional)" />
          <div className="flex gap-2">
            <Button
              variant={newProjectType === 'projeto' ? 'default' : 'secondary'}
              onClick={() => setNewProjectType('projeto')}
              className="flex-1"
            >
              Projeto
            </Button>
            <Button
              variant={newProjectType === 'tarefa' ? 'default' : 'secondary'}
              onClick={() => setNewProjectType('tarefa')}
              className="flex-1"
            >
              Tarefa
            </Button>
          </div>
          <Button disabled={creatingProject || !newProjectName.trim()} onClick={createNewProject}>
            {creatingProject ? 'Criando...' : 'Criar'}
          </Button>
          <Textarea
            value={newProjectDesc}
            onChange={(e) => setNewProjectDesc(e.target.value)}
            placeholder="Descrição (opcional)"
            className="md:col-span-4"
          />
        </div>
      </div>

      {/* Projects list */}
      <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white/80">Seus projetos</div>
          {activeProject && <div className="text-xs text-white/60">Ativo: {activeProject.name}</div>}
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProjectId(p.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                p.id === activeProjectId ? 'border-white/30 bg-white/10' : 'border-white/10 bg-black/20 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  {p.description && <div className="mt-1 text-xs text-white/60 line-clamp-2">{p.description}</div>}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setProjectShareTarget(p);
                      setProjectShareOpen(true);
                    }}
                  >
                    Compartilhar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      await removeProject(p.id);
                    }}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            </button>
          ))}

          {!projects.length && <div className="text-sm text-white/60">Nenhum projeto criado ainda.</div>}
        </div>
      </div>

      {/* Kanban */}
      <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-white/80">Kanban</div>
            <div className="text-xs text-white/60">Colunas e cards do projeto selecionado.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="Nova coluna"
              className="w-56"
            />
            <Button disabled={!newColumnTitle.trim() || !activeProjectId} onClick={addKanbanColumn}>
              Adicionar coluna
            </Button>
          </div>
        </div>

        {projectBoardLoading && <div className="mt-4 text-sm text-white/60">Carregando board…</div>}

        {!activeProjectId && !projectBoardLoading && (
          <div className="mt-4 text-sm text-white/60">Selecione um projeto para ver o Kanban.</div>
        )}

        {!!activeProjectId && !projectBoardLoading && (
          <>
            {/* Add card */}
            <div className="mt-4 grid gap-2 md:grid-cols-6">
              <select
                className="h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm"
                value={newCardColumnId}
                onChange={(e) => setNewCardColumnId(e.target.value)}
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <Input
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                placeholder="Título do card"
                className="md:col-span-2"
              />
              <Input
                value={newCardColor}
                onChange={(e) => setNewCardColor(e.target.value as CardColor)}
                placeholder="Cor (ex: #22c55e)"
              />
              <Button
                className="md:col-span-2"
                disabled={!newCardTitle.trim() || !newCardColumnId}
                onClick={() => addKanbanCard(newCardColumnId)}
              >
                Adicionar card
              </Button>
              <Textarea
                value={newCardDesc}
                onChange={(e) => setNewCardDesc(e.target.value)}
                placeholder="Descrição (opcional)"
                className="md:col-span-6"
              />
            </div>

            {/* Columns */}
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {columns.map((col) => (
                <KanbanColumnView
                  key={col.id}
                  column={col}
                  columns={columns}
                  onOpen={(card) => openCard(card)}
                  onDelete={deleteKanbanCard}
                  onMove={moveKanbanCard}
                />
              ))}
            </div>

            {!columns.length && <div className="mt-4 text-sm text-white/60">Crie uma coluna para começar.</div>}
          </>
        )}
      </div>
    </div>
  );
}

function KanbanColumnView({
  column,
  columns,
  onOpen,
  onDelete,
  onMove,
}: {
  column: any;
  columns: any[];
  onOpen: (card: any) => void;
  onDelete: (columnId: string, cardId: string) => Promise<void>;
  onMove: (fromColumnId: string, toColumnId: string, cardId: string) => Promise<void>;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{column.title}</div>
        <div className="text-xs text-white/60">{(column.cards || []).length} cards</div>
      </div>

      <div className="mt-3 space-y-2">
        {(column.cards || []).map((card: any) => (
          <div key={card.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold" style={card.color ? { color: card.color } : undefined}>
                  {card.title}
                </div>
                {card.description && <div className="mt-1 text-xs text-white/60">{card.description}</div>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => onOpen(card)}>
                  Abrir
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(column.id, card.id)}
                >
                  Excluir
                </Button>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <div className="text-xs text-white/60">Mover:</div>
              <select
                className="h-8 rounded-lg border border-white/10 bg-black/30 px-2 text-xs"
                value={column.id}
                onChange={(e) => {
                  const to = e.target.value;
                  if (to && to !== column.id) onMove(column.id, to, card.id);
                }}
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}

        {!column.cards?.length && <div className="text-xs text-white/60">Sem cards.</div>}
      </div>
    </div>
  );
}
