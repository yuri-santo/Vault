import React, { useMemo } from 'react';
import { Button, Input, Skeleton } from '../../components/ui';
import type { DriveFile, DriveItem } from '../../lib/api';
import { Icon } from './Icons';

type Breadcrumb = { id: string; name: string };

type Props = {
  loading: boolean;

  driveOpenUrl: string | null;
  driveFolder: string;
  setDriveFolderState: (v: string) => void;
  saveDriveFolder: () => void | Promise<void>;

  driveEnabled: boolean;
  driveNeedsSetup: boolean;

  driveFiles: DriveFile[];
  removeDriveFile: (fileId: string) => void | Promise<void>;

  // explorer
  driveExplorerLoading: boolean;
  openDriveRoot: () => void | Promise<void>;
  drivePath: Breadcrumb[];
  goDriveBreadcrumb: (idx: number) => void;
  driveItems: DriveItem[];
  enterDriveFolder: (item: DriveItem) => void;

  pushToast: (message: string, type?: 'success' | 'error' | 'info') => void;
};

export default function DriveSection(props: Props) {
  const {
    loading,
    driveOpenUrl,
    driveFolder,
    setDriveFolderState,
    saveDriveFolder,
    driveEnabled,
    driveNeedsSetup,
    driveFiles,
    removeDriveFile,
    driveExplorerLoading,
    openDriveRoot,
    drivePath,
    goDriveBreadcrumb,
    driveItems,
    enterDriveFolder,
    pushToast,
  } = props;

  const hasFiles = useMemo(() => driveFiles.length > 0, [driveFiles.length]);

  return (
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
          ) : !hasFiles ? (
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
                      <a
                        href={f.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-violet-700 hover:text-violet-800"
                      >
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
          <b>Remover</b> aqui apenas oculta o arquivo da sua lista (não apaga do Drive). Para organizar ou excluir de verdade, use{' '}
          <b>Abrir pasta</b>.
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
            <div className="text-sm text-zinc-500">
              Defina uma pasta acima e clique em <b>Abrir raiz</b>.
            </div>
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
                          <div className="text-xs text-zinc-500 truncate">
                            {it.isFolder ? 'Pasta' : 'Arquivo'}
                            {it.modifiedTime ? ` • ${new Date(it.modifiedTime).toLocaleString()}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {it.isFolder ? (
                          <Button variant="secondary" onClick={() => enterDriveFolder(it)}>
                            Abrir
                          </Button>
                        ) : it.webViewLink ? (
                          <a
                            href={it.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-violet-700 hover:text-violet-800 font-medium"
                          >
                            Visualizar
                          </a>
                        ) : null}

                        <Button
                          variant="secondary"
                          onClick={() => {
                            navigator.clipboard.writeText(it.webViewLink || '').then(() => pushToast('Link copiado', 'success'));
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
  );
}
