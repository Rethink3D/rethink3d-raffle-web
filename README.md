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
VITE_THEME=padrao
```

`VITE_THEME` escolhe a identidade visual no build:

- **`feira`** (padrão) — tema sóbrio alinhado à Feira do Empreendedor do Sebrae: fundo claro, paleta vinho/navy/azul, tipografia Figtree, sem brilhos nem molduras de HUD, vocabulário sem jargão de jogo ("Desafios" no lugar de "Missões").
- **`cyber`** — tema gamificado original: fundo escuro com papel de parede, neon roxo e ciano, Orbitron/Rajdhani, GIFs e loader de Pokébola.

Ausente ou com valor desconhecido, resolve para `feira`. Trocar de tema exige novo build e novo deploy — não há troca em tempo de execução.

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

### Temas (`src/theme/*`)

Dois temas coexistem, selecionados no build por `VITE_THEME`.

- **`tokens.css`** — um bloco de variáveis CSS por tema, sob `:root[data-theme="..."]`. As cores são guardadas como canais RGB crus (`--c-primary: 149 15 41`) porque o Tailwind as consome com `<alpha-value>`, e o código usa modificadores de opacidade em volume (`bg-brand-surface/60`).
- **`decor.css`** — utilitários decorativos (brilhos, grade, painel) e a neutralização deles no tema feira: molduras de HUD, relâmpagos, caixa alta, espaçamento de letra, raio de canto, faixas de recesso e tamanhos mínimos de fonte. Importado pelo `main.tsx`, não por `@import` no `index.css` — a especificação de CSS exige que `@import` preceda as demais regras, e a ordem da cascata ficaria imprevisível. Pelo mesmo motivo usa CSS puro em vez de `@apply`, que só funciona em arquivos com diretivas `@tailwind`.
- **`current.ts`** — resolve o tema ativo a partir de `import.meta.env.VITE_THEME`.
- **`assets.tsx`** — componente `ThemeAsset`, que troca loader, estados vazios, selo de sucesso e decoração do hero conforme o tema.
- **`copy.ts`** — rótulos textuais por tema. Guarda **frases inteiras**, não substantivos a serem interpolados: em português, colar o substantivo quebra a concordância ("Desafios congeladas", "NENHUMA DESAFIO").

O atributo `data-theme` é injetado no `<html>` por um plugin do Vite (`themeHtml` em `vite.config.ts`), que também troca as fontes do Google, o favicon, as taglines do `<head>` e remove o `<script>` do lottie-player no tema feira.

**Ao mexer em `tailwind.config.js`, reinicie o dev server.** O Vite não recarrega a configuração do Tailwind em processo, e as classes novas ficam ausentes da folha de estilo enquanto o build já as gera normalmente.

### Estado global (`src/store/*`)

- **`authStore.ts`**: token JWT, dados de usuário/admin, papel (role), fluxo de troca obrigatória de PIN, e controle do popup de bônus de cadastro.
- **`drawStore.ts`**: espelha os eventos do gateway de sorteio ao vivo do backend (id/status do sorteio, sessão, prévia de participantes, totais de tickets, estado de "girando"/vencedor, contagem de espectadores online, motivo de encerramento da sessão).

### Integração com o backend

- `VITE_API_URL` — chamadas REST via axios / TanStack Query.
- `VITE_SOCKET_URL` — conexão Socket.IO para o namespace `/draw` (sorteio ao vivo, sem autenticação).

Mantenha os contratos de API (tipos, payloads) sincronizados com o backend ao alterar qualquer um dos dois lados.
