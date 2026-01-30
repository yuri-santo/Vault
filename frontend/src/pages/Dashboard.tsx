import React, { useEffect, useMemo, useState } from 'react';
import { Button, Input, Textarea, cn } from '../components/ui';
import { createEntry, deleteEntry, listEntries, type VaultEntry, updateEntry } from '../lib/api';
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

  async function load() {
    setLoading(true);
    try {
      const data = await listEntries();
      setEntries(data);
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

        <div className="mt-4 rounded-2xl bg-white border border-zinc-100 shadow-soft overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-100 text-left text-xs text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Senha</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Atualizado</th>
                  <th className="px-4 py-3 w-[140px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr><td className="px-4 py-6 text-zinc-500" colSpan={7}>Carregando…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td className="px-4 py-6 text-zinc-500" colSpan={7}>Nenhuma entrada encontrada.</td></tr>
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
                        <td className="px-4 py-3 text-zinc-500">{fmtDate(e.updatedAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            <button className="text-xs text-zinc-600 hover:text-zinc-900" onClick={() => openEdit(e)}>Editar</button>
                            <button className="text-xs text-rose-600 hover:text-rose-700" onClick={() => remove(e.id)}>Excluir</button>
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
      </main>

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
