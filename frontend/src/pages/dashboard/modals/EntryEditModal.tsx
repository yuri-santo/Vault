import React from 'react';
import { Button, Input, Textarea } from '../../../components/ui';
import { Modal } from '../../../components/modal';
import { Icon } from '../Icons';
import { copyText as copyToClipboard } from '../../../lib/clipboard';

// NOTE: Keeping this component intentionally flexible to avoid blocking builds
// while the data model evolves. We can tighten types later.
export default function EntryEditModal({
  open,
  editing,
  form,
  setForm,
  sapConn,
  setSapConn,
  vpnConn,
  setVpnConn,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: boolean;
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  sapConn: any;
  setSapConn: React.Dispatch<React.SetStateAction<any>>;
  vpnConn: any;
  setVpnConn: React.Dispatch<React.SetStateAction<any>>;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal open={open} title={editing ? 'Editar senha' : 'Nova senha'} onClose={onClose} size="xl">
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
          <Input
            value={form.name}
            onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))}
            placeholder="Ex.: AWS Console"
          />
        </div>

        {(['generic', 'website'].includes((form as any).entryType)) && (
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600">URL (opcional)</label>
            <div className="flex gap-2">
              <Input
                value={form.url}
                onChange={(e) => setForm((p: any) => ({ ...p, url: e.target.value }))}
                placeholder="Ex.: https://..."
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => copyToClipboard(form.url)}
                disabled={!String(form.url || '').trim()}
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
                onChange={(e) => setForm((p: any) => ({ ...p, username: e.target.value }))}
                placeholder="Ex.: root"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-600">Senha</label>
              <Input
                value={form.password}
                onChange={(e) => setForm((p: any) => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
          </>
        )}

        {((form as any).entryType === 'generic') && (
          <div>
            <label className="text-xs font-medium text-zinc-600">IP {'/'} Host</label>
            <Input
              value={form.ip}
              onChange={(e) => setForm((p: any) => ({ ...p, ip: e.target.value }))}
              placeholder="Ex.: 10.0.0.10"
            />
          </div>
        )}
        {((form as any).entryType === 'generic') && (
          <div>
            <label className="text-xs font-medium text-zinc-600">E-mail vinculado</label>
            <Input
              value={form.email}
              onChange={(e) => setForm((p: any) => ({ ...p, email: e.target.value }))}
              placeholder="Ex.: admin@empresa.com"
            />
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
                  onClick={() => copyToClipboard(JSON.stringify(sapConn, null, 2))}
                  title="Copiar JSON"
                >
                  <Icon name="copy" className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-600">Cliente</label>
                <Input value={sapConn.client} onChange={(e) => setSapConn((p: any) => ({ ...p, client: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">Sistema</label>
                <Input value={sapConn.systemId} onChange={(e) => setSapConn((p: any) => ({ ...p, systemId: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">Instância</label>
                <Input value={sapConn.instance} onChange={(e) => setSapConn((p: any) => ({ ...p, instance: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">Servidor</label>
                <Input value={sapConn.ashost} onChange={(e) => setSapConn((p: any) => ({ ...p, ashost: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">Router</label>
                <Input value={sapConn.router} onChange={(e) => setSapConn((p: any) => ({ ...p, router: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">Idioma</label>
                <Input value={sapConn.lang} onChange={(e) => setSapConn((p: any) => ({ ...p, lang: e.target.value }))} />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-zinc-500">
              Esses campos são salvos dentro da entrada e podem ser exportados.
            </div>
          </div>
        )}

        {((form as any).entryType === 'vpn') && (
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-medium text-zinc-600">Conexão VPN (campos)</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => copyToClipboard(JSON.stringify(vpnConn, null, 2))}
                  title="Copiar JSON"
                >
                  <Icon name="copy" className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-600">Servidor</label>
                <Input value={vpnConn.server} onChange={(e) => setVpnConn((p: any) => ({ ...p, server: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">Protocolo</label>
                <Input value={vpnConn.protocol} onChange={(e) => setVpnConn((p: any) => ({ ...p, protocol: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">Usuário</label>
                <Input value={vpnConn.user} onChange={(e) => setVpnConn((p: any) => ({ ...p, user: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">Observação</label>
                <Input value={vpnConn.note} onChange={(e) => setVpnConn((p: any) => ({ ...p, note: e.target.value }))} />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-zinc-500">
              Esses campos são salvos dentro da entrada e podem ser exportados.
            </div>
          </div>
        )}

        {((form as any).entryType === 'json') && (
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600">JSON {'/'} ENV</label>
            <Textarea
              value={form.jsonPayload}
              onChange={(e) => setForm((p: any) => ({ ...p, jsonPayload: e.target.value }))}
              rows={10}
              placeholder="Cole aqui um JSON ou variáveis ENV..."
              className="font-mono"
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
            onChange={(e) => setForm((p: any) => ({ ...p, notes: e.target.value }))}
            rows={3}
            placeholder="Observações internas..."
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={onSave}>{editing ? 'Salvar alterações' : 'Criar senha'}</Button>
      </div>
    </Modal>
  );
}
