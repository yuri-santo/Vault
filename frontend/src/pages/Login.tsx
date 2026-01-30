import React, { useMemo, useState } from 'react';
import { Button, Card, Input } from '../components/ui';
import { createSession } from '../lib/api';
import { useToast } from '../components/toast';
import { fbAuth } from '../lib/firebase';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';

export default function Login({ onLogged }: { onLogged: (user: { uid: string; email?: string; role?: string }) => void }) {
  const { push } = useToast();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);

  const host = useMemo(() => (typeof window !== 'undefined' ? window.location.hostname : ''), []);

  async function signInWithIdToken(idToken: string) {
    const u = await createSession(idToken);
    onLogged(u);
    push('Login realizado com sucesso ✅', 'success');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (!email || !password) {
        push('Preencha e-mail e senha', 'error');
        return;
      }

      let cred;
      if (mode === 'signup') {
        if (password !== password2) {
          push('As senhas não conferem', 'error');
          return;
        }
        cred = await createUserWithEmailAndPassword(fbAuth, email, password);
      } else {
        cred = await signInWithEmailAndPassword(fbAuth, email, password);
      }
      const idToken = await cred.user.getIdToken();
      await signInWithIdToken(idToken);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') return push('Este e-mail já está em uso. Faça login.', 'error');
      if (code === 'auth/invalid-credential') return push('E-mail ou senha inválidos.', 'error');
      if (code === 'auth/too-many-requests') return push('Muitas tentativas. Aguarde e tente novamente.', 'error');
      push('Falha na autenticação. Verifique os dados e tente novamente.', 'error');
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
      const code = err?.code || '';
      if (code === 'auth/unauthorized-domain') {
        push(
          `Domínio não autorizado no Firebase Auth. Adicione "${host}" em Firebase Console → Authentication → Settings → Authorized domains.`,
          'error'
        );
        return;
      }
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
        <Card
          title={mode === 'signin' ? 'Entrar' : 'Criar conta'}
          subtitle={
            mode === 'signin'
              ? 'Use seu e-mail e senha para acessar o painel.'
              : 'Cadastro livre: crie sua conta e comece a usar o cofre.'
          }
        >
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mode === 'signin' ? 'primary' : 'secondary'}
                onClick={() => setMode('signin')}
                disabled={loading}
              >
                Entrar
              </Button>
              <Button
                type="button"
                variant={mode === 'signup' ? 'primary' : 'secondary'}
                onClick={() => setMode('signup')}
                disabled={loading}
              >
                Cadastro
              </Button>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">E-mail</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Senha</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-medium text-zinc-600">Confirmar senha</label>
                <Input
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processando…' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
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
          <div className="mt-4 text-xs text-zinc-500 space-y-2">
            <div>
              Dica: para criar usuários, não adianta inserir manualmente no banco — o usuário precisa existir no Firebase
              Authentication (o cadastro acima resolve isso).
            </div>
            <div className="text-zinc-400">
              Google Login: se aparecer "unauthorized-domain", adicione o domínio atual (<span className="font-mono">{host}</span>) em
              Firebase Console → Authentication → Settings → Authorized domains.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
