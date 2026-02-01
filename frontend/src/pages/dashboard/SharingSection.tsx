import React from 'react';
import { Button, Input, Skeleton } from '../../components/ui';
import type { ShareConnection, ShareInvite } from '../../lib/api';
import { Icon } from './Icons';

export default function SharingSection({
  loading,
  shareEmail,
  setShareEmail,
  doSendInvite,
  connections,
  receivedInvites,
  sentInvites,
  doAccept,
  doDecline,
  refreshAll,
}: {
  loading: boolean;
  shareEmail: string;
  setShareEmail: (v: string) => void;
  doSendInvite: () => void;
  connections: ShareConnection[];
  receivedInvites: ShareInvite[];
  sentInvites: ShareInvite[];
  doAccept: (id: string) => void;
  doDecline: (id: string) => void;
  refreshAll: () => void;
}) {
  return (
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
          <Input
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            placeholder="email@exemplo.com"
          />
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
                <div
                  key={c.inviteId}
                  className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-3 flex items-center justify-between"
                >
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
                  <div
                    key={i.id}
                    className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-3 flex items-center justify-between gap-3"
                  >
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
                <div
                  key={i.id}
                  className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-3 flex items-center justify-between"
                >
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
  );
}
