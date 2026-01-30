import React, { useState } from 'react';
import { Button, Card, Input } from '../components/ui';
import { createSession } from '../lib/api';
import { useToast } from '../components/toast';
import { fbAuth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

export default function Login({ onLogged }: { onLogged: (user: { uid: string; email?: string; role?: string }) => void }) {
  const { push } = useToast();
  const [email, setEmail] = useState('admin@easymakers.senior');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithIdToken(idToken: string) {
    const u = await createSession(idToken);
    onLogged(u);
    push('Login realizado com sucesso ✅', 'success');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(fbAuth, email, password);
      const idToken = await cred.user.getIdToken();
      await signInWithIdToken(idToken);
    } catch (err: any) {
      push(err?.response?.data?.message ? `Erro: ${err.response.data.message}` : 'Falha no login', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loginGoogle() {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(fbAuth, provider);
      const idToken = await cred.user.getIdToken();
      await signInWithIdToken(idToken);
    } catch (err: any) {
      push('Falha ao entrar com Google', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-2xl font-semibold">Cofre de Senhas</div>
          <div className="text-zinc-500 mt-1 text-sm">Acesso interno • autenticação segura</div>
        </div>
        <Card title="Entrar" subtitle="Use seu e-mail e senha para acessar o painel.">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-600">E-mail</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Senha</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-200" />
              <div className="text-xs text-zinc-400">ou</div>
              <div className="h-px flex-1 bg-zinc-200" />
            </div>
            <Button type="button" variant="secondary" className="w-full" onClick={loginGoogle} disabled={loading}>
              Entrar com Google
            </Button>
          </form>
          <div className="mt-4 text-xs text-zinc-500">
            Dica: após o primeiro acesso, altere a senha do usuário administrador.
          </div>
        </Card>
      </div>
    </div>
  );
}
