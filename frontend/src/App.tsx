import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { initCsrf, logout, me, type SessionUser } from './lib/api';
import { setClientLoggerUser } from './lib/clientLogger';
import { ToastProvider, useToast } from './components/toast';
import { fbAuth } from './lib/firebase';
import { signOut } from 'firebase/auth';

function AppInner() {
  const nav = useNavigate();
  const { push } = useToast();
  const [init, setInit] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await initCsrf();
      } catch {
        // ignore; backend might be down
      }

      try {
        const u = await me();
        setUser(u);
        setClientLoggerUser({ uid: u.uid, email: u.email });
      } catch {
        setUser(null);
        setClientLoggerUser(undefined);
      } finally {
        setInit(false);
      }
    })();
  }, []);

  async function doLogout() {
    try {
      await logout();
    } catch {
      // ignore
    }
    try {
      await signOut(fbAuth);
    } catch {
      // ignore
    }
    setUser(null);
    setClientLoggerUser(undefined);
    push('Sessão encerrada', 'info');
    nav('/login');
  }

  if (init) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-zinc-500">
        Carregando…
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/app" replace />
          ) : (
            <Login
              onLogged={(u) => {
                setUser(u);
                setClientLoggerUser({ uid: u.uid, email: u.email });
                nav('/app');
              }}
            />
          )
        }
      />
      <Route
        path="/app"
        element={
          user ? (
            <Dashboard userEmail={user.email ?? '(sem e-mail)'} onLogout={doLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to={user ? '/app' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
