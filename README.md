# Password Vault Pro — Cofre de Senhas (Full Stack) com Firebase + Render

Aplicação web **full stack em TypeScript** para uso interno como “cofre de senhas” compartilhado, com foco em **segurança**, **simplicidade operacional** e **UX de dashboard**.

> Objetivo: centralizar credenciais técnicas (IPs, usuários, senhas, e-mails, dados de conexão e observações) com armazenamento criptografado, auditoria de acessos e autenticação robusta.

---

## Principais funcionalidades

- **Autenticação** com **Firebase Auth (E-mail/Senha)**
- **Sessão segura no backend** com **Firebase Session Cookie (HttpOnly)**
- **Proteção CSRF** (requisições que alteram dados exigem token)
- **Criptografia AES-256-GCM** para dados sensíveis:
  - **salt + IV únicos por campo**
  - integridade garantida (GCM Authentication Tag)
- **Dashboard moderno** (React + Vite + Tailwind) com CRUD completo
- **Auditoria** em **Firestore** (coleção de logs) + logs do servidor (arquivo rotativo)
- **Hardening** de API: Helmet, rate limiting, CORS restrito, validações e `.env` para segredos

---

## Escopo de visualização (cofre compartilhado)

Por padrão, ao autenticar, o usuário vê **todas as entradas** do cofre (modelo “shared vault”).  
Se você quiser evoluir para multi-tenant (por time/empresa) ou permissões por grupo, isso pode ser implementado em uma fase seguinte.

---

## Arquitetura e stack

### Backend (`/backend`)
- Node.js + Express
- Firebase Admin SDK (validação de idToken, criação de session cookie)
- Firestore:
  - `vaultEntries` (dados do cofre)
  - `auditLogs` (eventos de auditoria)
- Criptografia por campo (AES-256-GCM)
- Segurança: Helmet, Rate limit, CORS restrito, CSRF

### Frontend (`/frontend`)
- React + Vite
- TailwindCSS
- Axios com `withCredentials` (sessões HttpOnly)
- Fluxo de CSRF (token obtido em `/auth/csrf`)

### Documentação (`/docs`)
- Guia de deploy no Render
- Checklist de segurança e operação
- Boas práticas de rotação de chaves e gestão de acessos

---

## Modelo de dados (entradas do cofre)

Cada registro pode conter:

- **Nome da entrada**
- **IP**
- **Usuário**
- **Senha** (criptografada)
- **E-mail**
- **Dados de conexão**
- **Observações**
- **Data de criação / atualização**

> Observação: campos sensíveis são armazenados criptografados no banco.

---

## Segurança: como a aplicação protege os dados

### 1) Senhas de login
- Senhas de usuários **não ficam no projeto**.
- O Firebase Auth gerencia o armazenamento seguro das credenciais do usuário final.

### 2) Sessões
- O backend troca o `idToken` do Firebase por um **Session Cookie HttpOnly**.
- Cookies HttpOnly reduzem risco de exfiltração por XSS.

### 3) Criptografia no banco
- Dados sensíveis do cofre são criptografados usando **AES-256-GCM**.
- Cada campo criptografado usa:
  - **salt único**
  - **IV único**
  - **Auth Tag** para integridade e proteção contra adulteração

> A chave mestra de criptografia é fornecida via variável de ambiente (**nunca** comitada).

### 4) CSRF
- Rotas de escrita (POST/PUT/PATCH/DELETE) exigem CSRF token.
- Frontend obtém token em `/auth/csrf` e envia em `X-CSRF-Token`.

### 5) Hardening de API
- Helmet (headers de segurança)
- Rate limiting (reduz brute force / abuso)
- CORS restrito ao domínio do frontend
- Validação de payloads e rotas

---

## Recomendações de segurança (fortemente recomendadas)

### Gestão de segredos
- **Nunca** commitar `.env` ou credenciais.
- Use sempre variáveis do **Render Environment** em produção.
- Rotacione:
  - chave mestra de criptografia (com planejamento)
  - service account do Firebase (quando necessário)
- Restrinja acesso ao Firestore via IAM e regras adequadas.

### Acesso administrativo
- Evite “usuário admin padrão” hardcoded.
- Crie administradores manualmente no Firebase Auth.
- Conceda privilégios via “role/claim” (ex.: `role=ADMIN`).

### Operação segura
- Ative 2FA no Google (conta que administra Firebase/GCP).
- Restrinja quem pode ver “Environment Variables” no Render.
- Faça backup/exports periódicos (auditLogs e vaultEntries).

### Proteção do frontend
- Use CSP (Content-Security-Policy) se necessário.
- Evite exibir conteúdo sensível por padrão; use “revelar” sob ação explícita.
- Preferir “copiar” ao “mostrar”.

---

## Setup local (visão geral)

### Backend
1. Configure as variáveis de ambiente necessárias (ver `.env.example`)
2. Instale dependências e rode o servidor em modo dev

### Frontend
1. Configure `VITE_API_URL` e `VITE_FIREBASE_*` (config do app Web do Firebase)
2. Rode o Vite dev server

> Dica: em desenvolvimento, o frontend roda normalmente em `http://localhost:5173` e o backend em `http://localhost:3001`.

---

## Deploy no Render (simplificado)

Você vai criar **2 serviços** no Render:

### 1) Backend (Web Service)
- **Root Directory:** `backend`
- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm start`

Configure Environment Variables do backend (produção), incluindo:
- credenciais do Firebase Admin (via JSON em 1 linha)
- chave mestra de criptografia
- origem CORS do frontend
- flags de cookie/segurança compatíveis com HTTPS

### 2) Frontend (Static Site)
- **Root Directory:** `frontend`
- **Build Command:** `npm ci && npm run build`
- **Publish Directory:** `dist`

Configure Environment Variables do frontend:
- `VITE_API_URL` apontando para o backend do Render
- `VITE_FIREBASE_*` do App Web no Firebase

> O passo a passo detalhado (com prints e checklist) deve ficar em `docs/DEPLOY_RENDER.md`.

---

## Auditoria e logs

### Firestore (auditoria)
A aplicação registra eventos como:
- login bem-sucedido
- falha de login
- logout
- criação/edição/exclusão de entradas

### Logs do servidor
Logs de runtime e requisições são gravados em arquivo rotativo (útil para troubleshooting e auditoria operacional).

---

## Scripts

### Backend
- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm start` — iniciar produção
- `npm run firebase:seed-admin` — (opcional) utilitário para promover usuário a ADMIN por claim/role  
  **Obs.: recomendado rodar de forma pontual e remover variáveis temporárias após o uso.**

### Frontend
- `npm run dev` — desenvolvimento
- `npm run build` — build estático
- `npm run preview` — pré-visualização local do build

---

## Limitações conhecidas e próximos passos (opcional)

- Permissões por grupo/time (RBAC completo)
- Segregação por workspace (multi-tenant)
- Reautenticação para revelar senha (alto nível)
- 2FA (TOTP) para contas administrativas
- Tela interna de “Auditoria” no dashboard

---

## Licença
Uso interno. Ajuste conforme sua política organizacional.
