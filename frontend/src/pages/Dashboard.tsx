import React, { useEffect, useMemo, useState } from 'react';
import { Button, Input, Textarea, cn, Card } from '../components/ui';
import {
  createEntry,
  deleteEntry,
  listEntries,
  type VaultEntry,
  updateEntry,
  updateEntryShare,
  listInvites,
  sendInvite,
  acceptInvite,
  declineInvite,
  listConnections,
  getNotes,
  saveNotes,
  getDriveSettings,
  setDriveFolder,
  listDriveFiles,
  uploadDriveFile,
  deleteDriveFile,
  type ShareInvite,
  type ShareConnection,
  type DriveFile,
} from '../lib/api';
import { Modal } from '../components/modal';
import { useToast } from '../components/toast';

function mask(v: string | null | undefined) {
  if (!v) return '';
  return '•'.repeat(Math.min(12, Math.max(8, v.length)));
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

const emptyForm = {
  name: '',
  ip: '',
  username: '',
  password: '',
  email: '',
  connectionData: '',
  notes: ''
};

export default function Dashboard({ userEmail, onLogout }: { userEmail: string; onLogout: () => void }) {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [q, setQ] = useState('');
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  // Compartilhamento
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitesSent, setInvitesSent] = useState<ShareInvite[]>([]);
  const [invitesReceived, setInvitesReceived] = useState<ShareInvite[]>([]);
  const [connections, setConnections] = useState<ShareConnection[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareEntry, setShareEntry] = useState<VaultEntry | null>(null);
  const [shareUids, setShareUids] = useState<string[]>([]);

  // Notas
  const [scratch, setScratch] = useState('');
  const [scratchSaving, setScratchSaving] = useState(false);
  const [scratchUpdatedAt, setScratchUpdatedAt] = useState<string | null>(null);

  // Drive
  const [driveEnabled, setDriveEnabled] = useState(false);
  const [driveMode, setDriveMode] = useState<string>('disabled');
  const [driveUploadEnabled, setDriveUploadEnabled] = useState(false);
  const [driveOpenUrl, setDriveOpenUrl] = useState<string | null>(null);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [driveFolderInput, setDriveFolderInput] = useState('');
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const isEditing = Boolean(editingId);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter((e) =>
      [e.name, e.ip ?? '', e.username ?? '', e.email ?? '', e.connectionData ?? '', e.notes ?? '']
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [entries, q]);

  async function loadSharing() {
    try {
      const inv = await listInvites();
      setInvitesSent(inv.sent);
      setInvitesReceived(inv.received);
      const con = await listConnections();
      setConnections(con.connections);
    } catch {
      // silencioso
    }
  }

  async function loadScratch() {
    try {
      const r = await getNotes();
      setScratch(r.notes ?? '');
      setScratchUpdatedAt(r.updatedAt);
    } catch {
      // silencioso
    }
  }

  async function loadDrive() {
    try {
      const s = await getDriveSettings();
      setDriveEnabled(!!s.enabled);
      setDriveMode((s.mode as any) ?? (s.enabled ? 'service_account' : 'disabled'));
      setDriveUploadEnabled(Boolean(s.uploadEnabled));
      setDriveOpenUrl((s.openUrl as any) ?? null);
      setDriveFolderId(s.folderId);
      if (s.folderId) setDriveFolderInput(s.folderId);
      if (s.enabled && s.folderId) {
        const f = await listDriveFiles();
        setDriveFiles(f.files);
      } else {
        setDriveFiles([]);
      }
    } catch {
      // silencioso
    }
  }

  async function load() {
    setLoading(true);
    try {
      const data = await listEntries();
      setEntries(data);
      // extras em paralelo (não bloqueia o uso do cofre)
      await Promise.all([loadSharing(), loadScratch(), loadDrive()]);
    } catch (err: any) {
      push('Erro ao carregar entradas', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  }

  function openEdit(e: VaultEntry) {
    setEditingId(e.id);
    setForm({
      name: e.name ?? '',
      ip: e.ip ?? '',
      username: e.username ?? '',
      password: e.password ?? '',
      email: e.email ?? '',
      connectionData: e.connectionData ?? '',
      notes: e.notes ?? ''
    });
    setModalOpen(true);
  }

  async function doSendInvite() {
    const email = inviteEmail.trim();
    if (!email) return push('Informe um e-mail para convidar', 'error');
    try {
      await sendInvite(email);
      setInviteEmail('');
      push('Convite enviado ✅', 'success');
      await loadSharing();
    } catch (err: any) {
      push(err?.response?.data?.message ? `Erro: ${err.response.data.message}` : 'Falha ao enviar convite', 'error');
    }
  }

  async function doAcceptInvite(inviteId: string) {
    try {
      await acceptInvite(inviteId);
      push('Convite aceito ✅', 'success');
      await loadSharing();
    } catch {
      push('Falha ao aceitar convite', 'error');
    }
  }

  async function doDeclineInvite(inviteId: string) {
    try {
      await declineInvite(inviteId);
      push('Convite recusado', 'success');
      await loadSharing();
    } catch {
      push('Falha ao recusar convite', 'error');
    }
  }

  function openShare(e: VaultEntry) {
    if (!e.canEdit) return;
    setShareEntry(e);
    setShareUids(e.sharedWith ?? []);
    setShareModalOpen(true);
  }

  async function saveShare() {
    if (!shareEntry) return;
    try {
      await updateEntryShare(shareEntry.id, shareUids);
      push('Compartilhamento atualizado ✅', 'success');
      setShareModalOpen(false);
      await load();
    } catch {
      push('Falha ao atualizar compartilhamento', 'error');
    }
  }

  async function doSaveScratch() {
    setScratchSaving(true);
    try {
      const r = await saveNotes(scratch);
      setScratchUpdatedAt(r.updatedAt);
      push('Notas salvas ✅', 'success');
    } catch {
      push('Falha ao salvar notas', 'error');
    } finally {
      setScratchSaving(false);
    }
  }

  async function doSetDriveFolder() {
    const v = driveFolderInput.trim();
    if (!v) return push('Informe um link/ID de pasta do Google Drive', 'error');
    setDriveLoading(true);
    try {
      const r = await setDriveFolder(v);
      setDriveFolderId(r.folderId);
      push('Pasta do Drive configurada ✅', 'success');
      await loadDrive();
    } catch (err: any) {
      push(err?.response?.data?.message ? `Erro: ${err.response.data.message}` : 'Falha ao configurar Drive', 'error');
    } finally {
      setDriveLoading(false);
    }
  }

  async function doRefreshDrive() {
    setDriveLoading(true);
    try {
      const f = await listDriveFiles();
      setDriveFiles(f.files);
    } catch {
      push('Falha ao listar arquivos do Drive', 'error');
    } finally {
      setDriveLoading(false);
    }
  }

  async function doUploadDrive(file: File) {
    setDriveLoading(true);
    try {
      await uploadDriveFile(file);
      push('Arquivo enviado ✅', 'success');
      await doRefreshDrive();
    } catch {
      push('Falha ao enviar arquivo', 'error');
    } finally {
      setDriveLoading(false);
    }
  }

  async function doDeleteDrive(fileId: string) {
    if (!confirm('Remover este arquivo do Drive?')) return;
    setDriveLoading(true);
    try {
      await deleteDriveFile(fileId);
      push('Arquivo removido', 'success');
      await doRefreshDrive();
    } catch {
      push('Falha ao remover arquivo', 'error');
    } finally {
      setDriveLoading(false);
    }
  }

  async function save() {
    if (!form.name.trim()) return push('Nome da entrada é obrigatório', 'error');
    if (!form.password.trim()) return push('Senha é obrigatória', 'error');

    const payload = {
      name: form.name.trim(),
      ip: form.ip.trim() || null,
      username: form.username.trim() || null,
      password: form.password,
      email: form.email.trim() || null,
      connectionData: form.connectionData.trim() || null,
      notes: form.notes.trim() || null
    };

    try {
      if (isEditing && editingId) {
        await updateEntry(editingId, payload);
        push('Entrada atualizada ✅', 'success');
      } else {
        await createEntry(payload as any);
        push('Entrada criada ✅', 'success');
      }
      setModalOpen(false);
      await load();
    } catch (err: any) {
      push(err?.response?.data?.message ? `Erro: ${err.response.data.message}` : 'Falha ao salvar', 'error');
    }
  }

  async function remove(id: string) {
    if (!confirm('Excluir esta entrada?')) return;
    try {
      await deleteEntry(id);
      push('Entrada excluída', 'success');
      await load();
    } catch {
      push('Falha ao excluir', 'error');
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 backdrop-blur bg-zinc-50/70 border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Cofre de Senhas</div>
            <div className="text-xs text-zinc-500">Logado como {userEmail}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={openCreate}>Nova entrada</Button>
            <Button variant="secondary" onClick={onLogout}>Sair</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, IP, usuário, e-mail…" className="sm:max-w-md" />
          <div className="text-xs text-zinc-500">{filtered.length} entradas</div>
        </div>

        <div className="mt-4 grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white border border-zinc-100 shadow-soft overflow-hidden">
              <div className="overflow-auto">
                <table className="min-w-[1060px] w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-100 text-left text-xs text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Senha</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Dono</th>
                  <th className="px-4 py-3">Atualizado</th>
                  <th className="px-4 py-3 w-[220px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr><td className="px-4 py-6 text-zinc-500" colSpan={8}>Carregando…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td className="px-4 py-6 text-zinc-500" colSpan={8}>Nenhuma entrada encontrada.</td></tr>
                ) : (
                  filtered.map((e) => {
                    const isRevealed = !!reveal[e.id];
                    return (
                      <tr key={e.id} className="hover:bg-zinc-50/60">
                        <td className="px-4 py-3 font-medium">{e.name}</td>
                        <td className="px-4 py-3 text-zinc-600">{e.ip ?? ''}</td>
                        <td className="px-4 py-3 text-zinc-600">
                          <div className="flex items-center gap-2">
                            <span>{e.username ?? ''}</span>
                            {e.username && (
                              <button
                                className="text-xs text-zinc-500 hover:text-zinc-900"
                                onClick={async () => { await copyToClipboard(e.username!); push('Usuário copiado'); }}
                              >Copiar</button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          <div className="flex items-center gap-2">
                            <span className={cn('font-mono', !isRevealed && 'select-none')}>{isRevealed ? (e.password ?? '') : mask(e.password)}</span>
                            {e.password && (
                              <>
                                <button
                                  className="text-xs text-zinc-500 hover:text-zinc-900"
                                  onClick={() => setReveal((p) => ({ ...p, [e.id]: !p[e.id] }))}
                                >{isRevealed ? 'Ocultar' : 'Revelar'}</button>
                                <button
                                  className="text-xs text-zinc-500 hover:text-zinc-900"
                                  onClick={async () => { await copyToClipboard(e.password!); push('Senha copiada'); }}
                                >Copiar</button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-600">{e.email ?? ''}</td>
                        <td className="px-4 py-3 text-zinc-500">
                          <div className="flex items-center gap-2">
                            <span>{e.ownerEmail ?? userEmail}</span>
                            {e.isShared && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">compartilhado</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-500">{fmtDate(e.updatedAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            {e.canEdit ? (
                              <>
                                <button className="text-xs text-zinc-600 hover:text-zinc-900" onClick={() => openShare(e)}>Compartilhar</button>
                                <button className="text-xs text-zinc-600 hover:text-zinc-900" onClick={() => openEdit(e)}>Editar</button>
                                <button className="text-xs text-rose-600 hover:text-rose-700" onClick={() => remove(e.id)}>Excluir</button>
                              </>
                            ) : (
                              <span className="text-xs text-zinc-400">Somente leitura</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
              </div>
            </div>

            <div className="mt-6 text-xs text-zinc-500">
              Dica: por segurança, revele/copiar senhas apenas quando necessário.
            </div>
          </div>

          <div className="space-y-4">
            <Card title="Compartilhamentos" subtitle="Convites exigem ação de quem envia e de quem recebe.">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Convidar por e-mail" />
                  <Button variant="secondary" onClick={doSendInvite} disabled={loading}>Enviar</Button>
                </div>

                {invitesReceived.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-zinc-600 mb-2">Convites recebidos</div>
                    <div className="space-y-2">
                      {invitesReceived.map((i) => (
                        <div key={i.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-50 border border-zinc-100">
                          <div className="text-xs text-zinc-700">
                            {i.fromEmail || 'Outro usuário'}
                          </div>
                          <div className="flex gap-2">
                            <button className="text-xs text-zinc-700 hover:text-zinc-900" onClick={() => doAcceptInvite(i.id)}>Aceitar</button>
                            <button className="text-xs text-rose-600 hover:text-rose-700" onClick={() => doDeclineInvite(i.id)}>Recusar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs font-medium text-zinc-600 mb-2">Conexões aceitas</div>
                  {connections.length === 0 ? (
                    <div className="text-xs text-zinc-500">Nenhuma conexão ainda.</div>
                  ) : (
                    <div className="space-y-1">
                      {connections.map((c) => (
                        <div key={c.uid} className="text-xs text-zinc-700 truncate">{c.email || c.uid}</div>
                      ))}
                    </div>
                  )}
                </div>

                {invitesSent.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-zinc-600 mb-2">Convites enviados</div>
                    <div className="space-y-1">
                      {invitesSent.map((i) => (
                        <div key={i.id} className="text-xs text-zinc-500 truncate">
                          {i.toEmail} • {i.status}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Drive (emergencial)" subtitle="Mostra apenas arquivos enviados por você (identificados no nome).">
              {!driveEnabled ? (
                <div className="text-xs text-zinc-500">Drive não está habilitado no servidor (configure GOOGLE_DRIVE_API_KEY ou GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON).</div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-zinc-600 mb-1">Pasta do Drive</div>
                    <div className="flex gap-2">
                      <Input value={driveFolderInput} onChange={(e) => setDriveFolderInput(e.target.value)} placeholder="Cole o link ou o ID da pasta" />
                      <Button variant="secondary" onClick={doSetDriveFolder} disabled={driveLoading}>Salvar</Button>
                    </div>
                    {driveFolderId && (
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-zinc-500">ID: {driveFolderId} • modo: {driveMode === 'public_link' ? 'link público' : 'service account'}</div>
                        {driveOpenUrl && (
                          <a className="text-[11px] text-indigo-600 hover:text-indigo-700" href={driveOpenUrl} target="_blank" rel="noreferrer">
                            Abrir pasta
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-600">Arquivos na pasta</label>
                    <Button variant="secondary" onClick={doRefreshDrive} disabled={driveLoading}>Atualizar</Button>
                  </div>

                  {!driveUploadEnabled && (
                    <div className="text-[11px] text-zinc-500">
                      Upload/remoção via app não estão disponíveis no modo <b>link público</b>. Use “Abrir pasta” para enviar arquivos pelo Drive.
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) doUploadDrive(f);
                        e.currentTarget.value = '';
                      }}
                      disabled={driveLoading || !driveFolderId || !driveUploadEnabled}
                    />
                  </div>

                  {driveFiles.length === 0 ? (
                    <div className="text-xs text-zinc-500">Nenhum arquivo listado.</div>
                  ) : (
                    <div className="space-y-2">
                      {driveFiles.map((f) => (
                        <div key={f.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-50 border border-zinc-100">
                          <a className="text-xs text-zinc-700 hover:text-zinc-900 truncate" href={f.webViewLink || '#'} target="_blank" rel="noreferrer">
                            {f.name}
                          </a>
                          {driveUploadEnabled && (
                            <button className="text-xs text-rose-600 hover:text-rose-700" onClick={() => doDeleteDrive(f.id)}>Remover</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>

            <Card title="Bloco de notas" subtitle="Rascunho rápido salvo no servidor (provisório).">
              <div className="space-y-2">
                <Textarea rows={7} value={scratch} onChange={(e) => setScratch(e.target.value)} placeholder="Escreva lembretes rápidos aqui..." />
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-zinc-500">{scratchUpdatedAt ? `Atualizado: ${fmtDate(scratchUpdatedAt)}` : '—'}</div>
                  <Button variant="secondary" onClick={doSaveScratch} disabled={scratchSaving}>{scratchSaving ? 'Salvando…' : 'Salvar'}</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Modal open={shareModalOpen} title={`Compartilhar: ${shareEntry?.name ?? ''}`} onClose={() => setShareModalOpen(false)}>
        <div className="space-y-3">
          {connections.length === 0 ? (
            <div className="text-sm text-zinc-500">Nenhuma conexão aceita ainda. Envie/aceite convites primeiro.</div>
          ) : (
            <div className="space-y-2">
              {connections.map((c) => {
                const checked = shareUids.includes(c.uid);
                return (
                  <label key={c.uid} className="flex items-center justify-between gap-3 p-2 rounded-xl border border-zinc-100 bg-zinc-50">
                    <div className="text-sm text-zinc-700 truncate">{c.email || c.uid}</div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setShareUids((prev) => {
                          if (e.target.checked) return Array.from(new Set([...prev, c.uid]));
                          return prev.filter((x) => x !== c.uid);
                        });
                      }}
                    />
                  </label>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShareModalOpen(false)}>Cancelar</Button>
            <Button onClick={saveShare} disabled={!shareEntry || connections.length === 0}>Salvar</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modalOpen}
        title={isEditing ? 'Editar entrada' : 'Nova entrada'}
        onClose={() => setModalOpen(false)}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600">Nome da entrada*</label>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ex: Servidor Produção" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">IP</label>
            <Input value={form.ip} onChange={(e) => setForm((p) => ({ ...p, ip: e.target.value }))} placeholder="Ex: 10.0.0.10" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Usuário</label>
            <Input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} placeholder="Ex: root" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Senha*</label>
            <Input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">E-mail</label>
            <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="contato@exemplo.com" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600">Dados de conexão</label>
            <Textarea rows={3} value={form.connectionData} onChange={(e) => setForm((p) => ({ ...p, connectionData: e.target.value }))} placeholder="Ex: ssh -p 2222 root@10.0.0.10" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600">Observações</label>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notas internas, regras, lembretes…" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button onClick={save}>{isEditing ? 'Salvar' : 'Criar'}</Button>
        </div>
      </Modal>
    </div>
  );
}
