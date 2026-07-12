# Rethink3D Raffle Web

Frontend do sistema de **sorteios e gamificação** da Rethink3D. Interface para participantes cumprirem missões e ganharem tickets, e painel administrativo para gerenciar campanhas, missões, prêmios e conduzir sorteios ao vivo. Consome a API [`rethink3d-raffle-api`](../rethink3d-raffle-api).

## Stack

- **React 19** + TypeScript
- **Vite 8**
- **Tailwind CSS 3**
- **Zustand 5** (com persistência) para estado global
- **TanStack Query 5** para dados remotos
- **React Router 7** para rotas
- **socket.io-client** para acompanhar o sorteio em tempo real
- **Recharts** para gráficos (resultados/ranking)
- **oxlint** para lint (não usa ESLint)
- Deploy via Netlify (`netlify.toml` com redirect de SPA)

## Configuração

Crie um `.env` na raiz com:

```bash
VITE_API_URL=
VITE_SOCKET_URL=
```

## Instalação e uso

```bash
npm install
npm run dev        # ambiente de desenvolvimento
npm run build       # tsc -b && vite build
npm run preview      # serve o build localmente
npm run lint          # oxlint
```

## Arquitetura

### Rotas (`src/routes/index.tsx`)

Rotas protegidas por papel via guards dedicados: `PublicRoute`, `ParticipantRoute`, `AdminRoute`, `HomeRedirect`. A maioria das páginas é carregada via lazy loading (exceto landing/login/register/dashboard, carregadas de forma eager para evitar flash de loading), com uma animação Lottie ("Pokébola") como fallback do Suspense.

### Páginas (`src/pages/*`)

- **`public/`**: Landing, Login, Cadastro, Troca de PIN.
- **`participant/`**: Dashboard, Missões (Quests), Quiz, Feedback, Pesquisa (Survey), acompanhamento do sorteio ao vivo, Ranking.
- **`admin/`**: Login admin, Dashboard, Campanhas, Missões (lista + formulário), Participantes/Provas de missão, Resultados de feedback/pesquisa, Prêmios, Controle de sorteio, Ranking.

A rota de acompanhamento do sorteio (`/watch/:campaignId`, `/draw/watch`) é pública, sem necessidade de login — espelha o namespace público do gateway Socket.IO do backend.

### Estado global (`src/store/*`)

- **`authStore.ts`**: token JWT, dados de usuário/admin, papel (role), fluxo de troca obrigatória de PIN, e controle do popup de bônus de cadastro.
- **`drawStore.ts`**: espelha os eventos do gateway de sorteio ao vivo do backend (id/status do sorteio, sessão, prévia de participantes, totais de tickets, estado de "girando"/vencedor, contagem de espectadores online, motivo de encerramento da sessão).

### Integração com o backend

- `VITE_API_URL` — chamadas REST via axios / TanStack Query.
- `VITE_SOCKET_URL` — conexão Socket.IO para o namespace `/draw` (sorteio ao vivo, sem autenticação).

Mantenha os contratos de API (tipos, payloads) sincronizados com o backend ao alterar qualquer um dos dois lados.
