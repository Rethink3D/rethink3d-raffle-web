# Tema Feira do Empreendedor — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar ao `rethink3d-raffle-web` um segundo tema visual, sóbrio e alinhado à Feira do Empreendedor do Sebrae, selecionado no build por `VITE_THEME`, preservando o tema gamificado atual intacto.

**Architecture:** Todos os tokens de cor, fonte e raio passam a ser variáveis CSS declaradas sob `:root[data-theme="feira"]` e `:root[data-theme="cyber"]`. O Tailwind consome essas variáveis como canais RGB crus, o que mantém funcionando os modificadores de opacidade já usados no código. Um plugin do Vite injeta o `data-theme` no `<html>`, troca as fontes do Google e remove o script do lottie no tema feira. A decoração cyberpunk (brilhos, molduras de HUD, grade, relâmpagos, caixa alta) é desligada por CSS, sem condicional em JSX. Só assets e rótulos textuais passam por módulos de tema em TypeScript.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind CSS 3, oxlint.

## Global Constraints

- Projeto: `C:\Rethink\rethink3d-raffle-web`. Rodar todo comando de dentro dessa pasta.
- **Não há framework de teste neste projeto.** Não existe jest, vitest ou similar, e este plano não introduz um — seria escopo alheio a um reskin. No lugar do ciclo TDD, cada tarefa tem uma verificação executável e falível: uma asserção via `grep` cujo resultado esperado está escrito, mais `npm run build` e `npm run lint`. Trate a asserção que falha como teste vermelho: só siga quando ela passar.
- Verificação obrigatória ao fim de toda tarefa, nos dois temas:
  ```bash
  VITE_THEME=cyber npm run build && VITE_THEME=feira npm run build && npm run lint
  ```
- **O tema `cyber` deve permanecer visualmente idêntico ao estado atual em todas as tarefas.** Qualquer regressão nele é motivo para parar e corrigir antes de seguir.
- Valores padrão: `VITE_THEME` ausente ou com valor desconhecido resolve para `feira`.
- Sem comentários em código novo — preferência registrada do autor do projeto. O código existente tem comentários; não removê-los fora do escopo da tarefa.
- Textos de interface em português do Brasil.
- Nomes de token semânticos, nunca literais de cor: `bg`, `surface`, `border`, `primary`, `glow`, `secondary`, `accent`, `highlight`, `success`, `danger`, `text`, `muted`.
- Paleta feira, valores exatos: `bg #FFFFFF`, `surface #F7F9FF`, `border #DDE3F0`, `primary #950F29`, `glow #B31434`, `secondary #2A4FDA`, `accent #005EB8`, `highlight #E7F79E`, `success #2E7D52`, `danger #C41E3A`, `text #1B244B`, `muted #687499`.
- Paleta cyber, valores exatos preservados: `bg #0a0a0f`, `surface #12121e`, `border #1e1e3a`, `primary #7c3aed`, `glow #a855f7`, `secondary #06b6d4`, `accent #f59e0b`, `highlight #f59e0b`, `success #10b981`, `danger #ef4444`, `text #e2e8f0`, `muted #64748b`.
- Fonte feira: Figtree, pesos 400 a 800. Fontes cyber preservadas: Orbitron, Rajdhani, Inter.
- Commits em português, no formato `tipo: descrição`, terminando com a linha de coautoria:
  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  ```
- Não fazer `push`. O autor do projeto envia ao remoto quando quiser.

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/theme/tokens.css` | Cria — só declarações de variáveis, um bloco por tema |
| `src/theme/decor.css` | Cria — utilitários decorativos e suas neutralizações por tema |
| `src/theme/current.ts` | Cria — resolve o tema ativo a partir de `import.meta.env` |
| `src/theme/assets.tsx` | Cria — componente `ThemeAsset` |
| `src/theme/copy.ts` | Cria — rótulos textuais por tema |
| `src/theme/env.d.ts` | Cria — tipagem de `import.meta.env.VITE_THEME` |
| `tailwind.config.js` | Modifica — cores e fontes passam a apontar para variáveis |
| `vite.config.ts` | Modifica — plugin `themeHtml` |
| `index.html` | Modifica — CSS crítico por tema, shell com os dois loaders |
| `src/index.css` | Modifica — importa `theme/tokens.css` e `theme/decor.css`, perde os utilitários que migraram |
| `.env` | Modifica — ganha `VITE_THEME` |
| `README.md` | Modifica — documenta `VITE_THEME` |
| 37 arquivos em `src/` | Modificam — renomeação de token, assets, rótulos, contraste |

---

### Task 1: Infraestrutura de tema

Entrega a espinha dorsal: variáveis por tema, seleção por `VITE_THEME`, Tailwind lendo variáveis. Ao final desta tarefa o tema `cyber` continua idêntico e o tema `feira` já muda as cores, mesmo que ainda feio.

**Files:**
- Create: `src/theme/tokens.css`
- Create: `src/theme/current.ts`
- Create: `src/theme/env.d.ts`
- Modify: `tailwind.config.js`
- Modify: `vite.config.ts`
- Modify: `index.html`
- Modify: `src/index.css`
- Modify: `.env`

**Interfaces:**
- Consumes: nada.
- Produces: `THEME` (`'feira' | 'cyber'`) exportado de `src/theme/current.ts`; tokens Tailwind `cyber-*` continuam válidos e agora resolvem por variável; classe utilitária `rounded-theme`.

- [ ] **Step 1: Escrever a asserção que deve falhar**

Crie `scripts/check-theme.sh` na raiz do projeto:

```bash
#!/usr/bin/env bash
set -e
fail() { echo "FALHOU: $1"; exit 1; }

grep -q 'VITE_THEME' .env || fail ".env sem VITE_THEME"
grep -q -- '--c-primary' src/theme/tokens.css || fail "tokens.css sem --c-primary"
grep -q 'data-theme="feira"' src/theme/tokens.css || fail "tokens.css sem bloco feira"
grep -q 'data-theme="cyber"' src/theme/tokens.css || fail "tokens.css sem bloco cyber"
grep -q 'rgb(var(--c-primary)' tailwind.config.js || fail "tailwind nao usa variavel"
grep -q 'alpha-value' tailwind.config.js || fail "tailwind sem alpha-value"
grep -q 'themeHtml' vite.config.ts || fail "vite sem plugin de tema"

echo "OK"
```

- [ ] **Step 2: Rodar a asserção e confirmar que falha**

```bash
bash scripts/check-theme.sh
```

Esperado: `FALHOU: .env sem VITE_THEME`, saída diferente de zero.

- [ ] **Step 3: Criar `src/theme/tokens.css`**

```css
:root[data-theme="cyber"] {
  --c-bg: 10 10 15;
  --c-surface: 18 18 30;
  --c-border: 30 30 58;
  --c-primary: 124 58 237;
  --c-glow: 168 85 247;
  --c-secondary: 6 182 212;
  --c-accent: 245 158 11;
  --c-highlight: 245 158 11;
  --c-success: 16 185 129;
  --c-danger: 239 68 68;
  --c-text: 226 232 240;
  --c-muted: 100 116 139;

  --font-display: 'Orbitron', sans-serif;
  --font-ui: 'Rajdhani', sans-serif;
  --font-body: 'Inter', sans-serif;

  --radius: 0.5rem;
}

:root[data-theme="feira"] {
  --c-bg: 255 255 255;
  --c-surface: 247 249 255;
  --c-border: 221 227 240;
  --c-primary: 149 15 41;
  --c-glow: 179 20 52;
  --c-secondary: 42 79 218;
  --c-accent: 0 94 184;
  --c-highlight: 231 247 158;
  --c-success: 46 125 82;
  --c-danger: 196 30 58;
  --c-text: 27 36 75;
  --c-muted: 104 116 153;

  --font-display: 'Figtree', sans-serif;
  --font-ui: 'Figtree', sans-serif;
  --font-body: 'Figtree', sans-serif;

  --radius: 1rem;
}
```

- [ ] **Step 4: Criar `src/theme/env.d.ts`**

```ts
interface ImportMetaEnv {
  readonly VITE_THEME?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_SOCKET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 5: Criar `src/theme/current.ts`**

```ts
export type ThemeId = 'feira' | 'cyber';

export const THEME: ThemeId =
  import.meta.env.VITE_THEME === 'cyber' ? 'cyber' : 'feira';
```

- [ ] **Step 6: Apontar o Tailwind para as variáveis**

Substitua o bloco `theme.extend` inteiro de `tailwind.config.js` por:

```js
  theme: {
    extend: {
      colors: {
        cyber: {
          bg:        'rgb(var(--c-bg) / <alpha-value>)',
          surface:   'rgb(var(--c-surface) / <alpha-value>)',
          border:    'rgb(var(--c-border) / <alpha-value>)',
          primary:   'rgb(var(--c-primary) / <alpha-value>)',
          glow:      'rgb(var(--c-glow) / <alpha-value>)',
          secondary: 'rgb(var(--c-secondary) / <alpha-value>)',
          accent:    'rgb(var(--c-accent) / <alpha-value>)',
          highlight: 'rgb(var(--c-highlight) / <alpha-value>)',
          success:   'rgb(var(--c-success) / <alpha-value>)',
          danger:    'rgb(var(--c-danger) / <alpha-value>)',
          text:      'rgb(var(--c-text) / <alpha-value>)',
          muted:     'rgb(var(--c-muted) / <alpha-value>)',
        }
      },
      fontFamily: {
        orbitron: 'var(--font-display)',
        rajdhani: 'var(--font-ui)',
        inter:    'var(--font-body)',
      },
      borderRadius: {
        theme: 'var(--radius)',
      },
    },
  },
```

O prefixo `cyber` e os nomes de fonte continuam os mesmos nesta tarefa de propósito: a renomeação vem na Task 2, isolada, para que um build quebrado aqui não se confunda com um erro de renomeação.

- [ ] **Step 7: Adicionar o plugin de tema ao Vite**

No topo de `vite.config.ts`, troque o import e acrescente o plugin:

```ts
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function themeHtml(theme: string): Plugin {
  return {
    name: 'rethink-theme-html',
    transformIndexHtml(html) {
      let out = html.replace(
        '<html lang="pt-BR">',
        `<html lang="pt-BR" data-theme="${theme}">`
      )
      if (theme === 'feira') {
        out = out
          .replace(
            /\s*<script src="https:\/\/unpkg\.com\/@lottiefiles[^>]*><\/script>/g,
            ''
          )
          .replace(
            /family=Inter[^"]*/g,
            'family=Figtree:wght@400;500;600;700;800&display=swap'
          )
      }
      return out
    },
  }
}
```

Depois converta o `export default` para a forma de função, preservando todo o conteúdo de `build` e `server` que já existe:

```ts
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const theme = env.VITE_THEME === 'cyber' ? 'cyber' : 'feira'

  return {
    plugins: [react(), themeHtml(theme)],
    build: { /* mantenha exatamente o objeto build atual */ },
    server: { /* mantenha exatamente o objeto server atual */ },
  }
})
```

- [ ] **Step 8: Tornar o CSS crítico do `index.html` sensível ao tema**

Em `index.html`, dentro do `<style>` inline, substitua a regra `html, body { ... }` por duas regras escopadas por tema, mantendo as demais regras do bloco como estão:

```css
      html, body {
        min-height: 100vh;
        -webkit-font-smoothing: antialiased;
        font-family: system-ui, -apple-system, sans-serif;
      }

      [data-theme="cyber"] body {
        background-color: #0a0a0f;
        background-image:
          linear-gradient(rgba(10, 10, 15, 0.88), rgba(10, 10, 15, 0.94)),
          url('/Background.webp');
        background-size: cover;
        background-position: center;
        background-attachment: fixed;
        background-repeat: no-repeat;
        color: #a0a0b8;
      }

      [data-theme="feira"] body {
        background-color: #ffffff;
        color: #687499;
      }

      [data-theme="feira"] #shell-logo { color: #1b244b; }
      [data-theme="feira"] #shell-logo span { color: #950f29; }
      [data-theme="feira"] #shell-sub { color: #687499; letter-spacing: 0.05em; text-transform: none; }
      [data-theme="feira"] #shell-hint { color: #98a2bd; letter-spacing: 0.05em; text-transform: none; }
```

Também troque a `<meta name="theme-color" content="#7c3aed" />` por `<meta name="theme-color" content="#950F29" />` — no tema cyber essa meta é cosmética e a diferença não é visível na interface.

- [ ] **Step 9: Importar os tokens no `index.css`**

No topo de `src/index.css`, antes das diretivas do Tailwind:

```css
@import './theme/tokens.css';
```

E na regra `body` do `@layer base`, remova as declarações de `background-image`, `background-size`, `background-position`, `background-attachment` e `background-repeat`. Elas passam a viver em `decor.css` na Task 3. Deixe a regra assim:

```css
@layer base {
  body {
    @apply bg-cyber-bg text-cyber-text font-inter antialiased overflow-x-hidden min-h-screen;
  }
```

- [ ] **Step 10: Declarar a variável no `.env`**

Acrescente ao `.env`:

```
VITE_THEME=feira
```

- [ ] **Step 11: Rodar a asserção e confirmar que passa**

```bash
bash scripts/check-theme.sh
```

Esperado: `OK`.

- [ ] **Step 12: Verificar os dois builds**

```bash
VITE_THEME=cyber npm run build && VITE_THEME=feira npm run build && npm run lint
```

Esperado: os dois builds concluem sem erro e o lint não reporta erro.

- [ ] **Step 13: Conferir que o `data-theme` chega ao HTML gerado**

```bash
VITE_THEME=cyber npm run build >/dev/null && grep -c 'data-theme="cyber"' dist/index.html
VITE_THEME=feira npm run build >/dev/null && grep -c 'data-theme="feira"' dist/index.html
grep -c 'lottiefiles' dist/index.html || echo "0 (esperado no tema feira)"
grep -c 'Figtree' dist/index.html
```

Esperado: `1` para cada `data-theme`; zero ocorrências de `lottiefiles` no build feira; pelo menos `1` ocorrência de `Figtree`.

- [ ] **Step 14: Confirmar visualmente que o tema cyber não regrediu**

```bash
VITE_THEME=cyber npm run dev
```

Abra `http://localhost:5173`, compare com o site atual em produção. Fundo preto, roxo neon, Orbitron nos títulos, brilhos presentes. Qualquer diferença é regressão: pare e corrija.

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: infraestrutura de dois temas com selecao por VITE_THEME

Move cores, fontes e raio de canto para variaveis CSS declaradas por
data-theme, com o Tailwind consumindo canais RGB crus para preservar os
modificadores de opacidade ja usados no codigo. Um plugin do Vite injeta
o data-theme no html, troca as fontes do Google e remove o script do
lottie no tema feira.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Renomear o namespace de tokens

Troca `cyber-*` por `brand-*` e os nomes de fonte por nomes de papel. Puramente mecânica, isolada numa tarefa só para que qualquer quebra tenha causa óbvia.

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/index.css`
- Modify: 37 arquivos em `src/`

**Interfaces:**
- Consumes: tokens definidos na Task 1.
- Produces: tokens Tailwind `brand-bg`, `brand-surface`, `brand-border`, `brand-primary`, `brand-glow`, `brand-secondary`, `brand-accent`, `brand-highlight`, `brand-success`, `brand-danger`, `brand-text`, `brand-muted`; classes de fonte `font-display`, `font-ui`, `font-body`.

- [ ] **Step 1: Registrar a contagem atual como linha de base**

```bash
grep -ro 'cyber-\(bg\|surface\|border\|primary\|glow\|secondary\|accent\|success\|danger\|text\|muted\)\b' src | wc -l
```

Anote o número. Esperado: `1233`.

- [ ] **Step 2: Escrever a asserção que deve falhar**

Acrescente ao final de `scripts/check-theme.sh`, antes do `echo "OK"`:

```bash
LEFT=$(grep -ro 'cyber-\(bg\|surface\|border\|primary\|glow\|secondary\|accent\|success\|danger\|text\|muted\)\b' src | wc -l)
[ "$LEFT" -eq 0 ] || fail "restaram $LEFT tokens cyber-* nao renomeados"

BRAND=$(grep -ro 'brand-\(bg\|surface\|border\|primary\|glow\|secondary\|accent\|highlight\|success\|danger\|text\|muted\)\b' src | wc -l)
[ "$BRAND" -ge 1233 ] || fail "esperava ao menos 1233 tokens brand-*, achei $BRAND"

grep -rq 'font-orbitron\|font-rajdhani\|font-inter' src && fail "restaram nomes de fonte antigos"
grep -rq 'clip-cyber' src && fail "restaram classes clip-cyber mortas"
true
```

- [ ] **Step 3: Rodar e confirmar que falha**

```bash
bash scripts/check-theme.sh
```

Esperado: `FALHOU: restaram 1233 tokens cyber-* nao renomeados`.

- [ ] **Step 4: Renomear os tokens de cor**

A âncora de fronteira de palavra (`\b`) e a lista explícita de papéis são obrigatórias: sem elas a substituição atingiria `cyber-grid`, `cyber-panel` e `clip-cyber-btn`, que são classes CSS e não tokens de cor.

```bash
grep -rl 'cyber-' src tailwind.config.js src/index.css \
  | xargs sed -i -E 's/\bcyber-(bg|surface|border|primary|glow|secondary|accent|highlight|success|danger|text|muted)\b/brand-\1/g'
```

- [ ] **Step 5: Renomear os nomes de fonte**

```bash
grep -rl 'font-orbitron\|font-rajdhani\|font-inter' src tailwind.config.js src/index.css \
  | xargs sed -i -E 's/\bfont-orbitron\b/font-display/g; s/\bfont-rajdhani\b/font-ui/g; s/\bfont-inter\b/font-body/g'
```

Em seguida ajuste as chaves em `tailwind.config.js`, que o `sed` acima não alcança porque lá elas aparecem sem o prefixo `font-`:

```js
      fontFamily: {
        display: 'var(--font-display)',
        ui:      'var(--font-ui)',
        body:    'var(--font-body)',
      },
```

E em `tailwind.config.js`, renomeie a chave `cyber` do objeto `colors` para `brand`.

- [ ] **Step 6: Remover as classes mortas `clip-cyber-*`**

Elas são referenciadas em quatro lugares mas nunca definidas em `index.css` nem no `tailwind.config.js`. São no-ops.

```bash
sed -i -E 's/ ?clip-cyber-(btn|card)//g' \
  src/components/ui/Button.tsx \
  src/components/ui/Card.tsx \
  src/components/ui/Modal.tsx \
  src/components/quest/QuestCard.tsx
```

Em `src/components/ui/Card.tsx`, a prop `clipCorner` agora não faz nada. Remova a prop da interface, o parâmetro com seu valor padrão e a linha `${clipCorner ? '' : ''}` que restou da expressão. Depois remova a passagem da prop nos pontos que a usam:

```bash
grep -rn 'clipCorner' src
```

Esperado ao final: nenhuma ocorrência.

- [ ] **Step 7: Varredura anti-corrupção**

A substituição em massa é ampla; esta varredura confirma que só o alvo pretendido mudou.

```bash
echo "--- cyber- residual (esperado: apenas cyber-grid e cyber-panel) ---"
grep -rho 'cyber-[a-z]*' src src/index.css tailwind.config.js | sort -u
echo "--- tokens compostos corrompidos (esperado: vazio) ---"
grep -rn 'brand-brand\|font-font\|brandbrand' src || echo "vazio"
```

Esperado: a primeira lista contém apenas `cyber-grid` e `cyber-panel`; a segunda imprime `vazio`.

- [ ] **Step 8: Rodar a asserção e confirmar que passa**

```bash
bash scripts/check-theme.sh
```

Esperado: `OK`.

- [ ] **Step 9: Verificar os dois builds**

```bash
VITE_THEME=cyber npm run build && VITE_THEME=feira npm run build && npm run lint
```

Esperado: sem erro. O tema cyber continua idêntico — a renomeação não muda nenhum valor.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: renomeia tokens cyber-* para brand-* e fontes para papeis

Num sistema de dois temas, um token chamado cyber servindo o tema feira
engana quem mantem o codigo. Remove tambem as classes clip-cyber-btn e
clip-cyber-card, referenciadas em quatro lugares e nunca definidas.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Neutralizar a decoração cyberpunk

Desliga brilhos, molduras de HUD, grade, relâmpagos e a tipografia em caixa alta — tudo por CSS, sem condicional em JSX.

**Files:**
- Create: `src/theme/decor.css`
- Modify: `src/index.css`
- Modify: `src/components/ui/Card.tsx`

**Interfaces:**
- Consumes: variáveis da Task 1, tokens `brand-*` da Task 2.
- Produces: classes `.hud-corner` e `.keep-caps`.

- [ ] **Step 1: Escrever a asserção que deve falhar**

Acrescente ao `scripts/check-theme.sh`, antes do `echo "OK"`:

```bash
grep -q 'hud-corner' src/theme/decor.css || fail "decor.css sem hud-corner"
grep -q 'keep-caps' src/theme/decor.css || fail "decor.css sem escape keep-caps"
grep -q 'hud-corner' src/components/ui/Card.tsx || fail "Card sem hud-corner"
grep -q "theme/decor.css" src/index.css || fail "index.css nao importa decor.css"
grep -q 'glow-primary' src/theme/decor.css || fail "decor.css sem os utilitarios de brilho"
grep -q 'glow-primary' src/index.css && fail "utilitarios de brilho ainda no index.css"
true
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
bash scripts/check-theme.sh
```

Esperado: `FALHOU: decor.css sem hud-corner`.

- [ ] **Step 3: Criar `src/theme/decor.css`**

Mova para cá, saindo do `src/index.css`, os utilitários de brilho, a grade e o painel. Depois some as neutralizações do tema feira.

```css
[data-theme="cyber"] body {
  background-image:
    linear-gradient(rgba(10, 10, 15, 0.88), rgba(10, 10, 15, 0.94)),
    url('/Background.webp');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-repeat: no-repeat;
}

[data-theme="feira"] body {
  background-image:
    linear-gradient(180deg, rgb(var(--c-surface)) 0%, rgb(var(--c-bg)) 340px);
  background-repeat: no-repeat;
}

.glow-primary   { box-shadow: 0 0 14px rgb(var(--c-primary) / 0.4); }
.glow-secondary { box-shadow: 0 0 14px rgb(var(--c-secondary) / 0.4); }
.glow-accent    { box-shadow: 0 0 14px rgb(var(--c-accent) / 0.4); }

.text-glow-primary   { text-shadow: 0 0 8px rgb(var(--c-glow) / 0.55); }
.text-glow-secondary { text-shadow: 0 0 8px rgb(var(--c-secondary) / 0.55); }
.text-glow-accent    { text-shadow: 0 0 8px rgb(var(--c-accent) / 0.55); }

.cyber-grid {
  background-size: 32px 32px;
  background-image:
    linear-gradient(to right,  rgb(var(--c-border) / 0.12) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(var(--c-border) / 0.12) 1px, transparent 1px);
}

.cyber-panel {
  @apply bg-brand-surface border border-brand-border rounded-theme relative overflow-hidden;
}

.cyber-panel::before {
  content: '';
  @apply absolute top-0 left-0 w-full h-[2px];
  background: linear-gradient(90deg, transparent, rgb(var(--c-primary)), transparent);
}

[data-theme="feira"] .glow-primary,
[data-theme="feira"] .glow-secondary,
[data-theme="feira"] .glow-accent {
  box-shadow: 0 1px 3px rgb(var(--c-text) / 0.08);
}

[data-theme="feira"] .text-glow-primary,
[data-theme="feira"] .text-glow-secondary,
[data-theme="feira"] .text-glow-accent {
  text-shadow: none;
}

[data-theme="feira"] .cyber-grid { background-image: none; }
[data-theme="feira"] .cyber-panel::before { display: none; }
[data-theme="feira"] .hud-corner { display: none; }

[data-theme="feira"] .animate-lightning-1,
[data-theme="feira"] .animate-lightning-2,
[data-theme="feira"] .animate-lightning-flash { display: none; }

[data-theme="feira"] .animate-pulse-glow,
[data-theme="feira"] .animate-pulse-glow-ticket,
[data-theme="feira"] .animate-float { animation: none; }

[data-theme="feira"] .uppercase:not(.keep-caps) { text-transform: none; }

[data-theme="feira"] .tracking-wide,
[data-theme="feira"] .tracking-wider,
[data-theme="feira"] .tracking-widest,
[data-theme="feira"] .tracking-tighter { letter-spacing: 0; }

[data-theme="feira"] .font-mono { font-family: var(--font-ui); }

[data-theme="feira"] .rounded-md,
[data-theme="feira"] .rounded-lg,
[data-theme="feira"] .rounded-xl { border-radius: var(--radius); }

[data-theme="feira"] ::-webkit-scrollbar-track { background: rgb(var(--c-surface)); }
[data-theme="feira"] ::-webkit-scrollbar-thumb { background: rgb(var(--c-border)); }
[data-theme="feira"] ::-webkit-scrollbar-thumb:hover { background: rgb(var(--c-muted)); }
```

A especificidade de `[atributo] .classe` é 0,2,0 e vence a do utilitário puro do Tailwind, 0,1,0. Por isso o override funciona sem `!important`. A classe `.keep-caps` é o escape para siglas e rótulos que precisam mesmo de caixa alta.

- [ ] **Step 4: Limpar o `src/index.css`**

Remova de lá os blocos que migraram: os seis utilitários de brilho, `.cyber-grid`, `.cyber-panel` e `.cyber-panel::before`. Mantenha as animações (`@keyframes` e suas classes) e a barra de rolagem base — o `decor.css` só sobrescreve. Acrescente o import logo abaixo do de `tokens.css`:

```css
@import './theme/tokens.css';
@import './theme/decor.css';
```

Os dois `@import` precisam vir antes das diretivas `@tailwind`, e o `decor.css` usa `@apply`, então ambos são processados pelo Tailwind normalmente.

- [ ] **Step 5: Marcar as molduras de HUD no `Card.tsx`**

Em `src/components/ui/Card.tsx`, acrescente `hud-corner` à className de cada um dos quatro cantos:

```tsx
      <div className={`hud-corner absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${cornerTextColors[variant]}`} />
      <div className={`hud-corner absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${cornerTextColors[variant]}`} />
      <div className={`hud-corner absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${cornerTextColors[variant]}`} />
      <div className={`hud-corner absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${cornerTextColors[variant]}`} />
```

E marque também a sobreposição de scanline logo acima delas, para que ela suma no tema feira:

```tsx
      <div className="hud-corner absolute inset-0 pointer-events-none bg-cyber-grid opacity-10" />
```

- [ ] **Step 6: Rodar a asserção e confirmar que passa**

```bash
bash scripts/check-theme.sh
```

Esperado: `OK`.

- [ ] **Step 7: Verificar os dois builds**

```bash
VITE_THEME=cyber npm run build && VITE_THEME=feira npm run build && npm run lint
```

- [ ] **Step 8: Conferir visualmente os dois temas**

```bash
VITE_THEME=feira npm run dev
```

Em `http://localhost:5173`: sem brilhos, sem molduras nos cantos dos cards, sem relâmpagos na landing, títulos em caixa mista. Depois:

```bash
VITE_THEME=cyber npm run dev
```

Tudo isso de volta, idêntico ao atual.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: neutraliza a decoracao cyberpunk no tema feira

Brilhos, molduras de HUD, grade, relampagos e a tipografia em caixa alta
com espacamento largo sao desligados por CSS sob o seletor do tema, sem
condicional em JSX. O override de utilitario resolve as 762 ocorrencias
de uppercase, tracking e font-mono sem editar nenhuma delas.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Componente `ThemeAsset` e o loader

Substitui o loader de Pokébola, que aparece em 12 blocos espalhados por 11 arquivos, por um componente único que resolve o asset conforme o tema.

**Files:**
- Create: `src/theme/assets.tsx`
- Modify: `src/routes/index.tsx:36-52`
- Modify: `src/pages/participant/DashboardPage.tsx:252-264`
- Modify: `src/pages/participant/FeedbackPage.tsx:180-192`
- Modify: `src/pages/participant/QuestsPage.tsx:109-121`
- Modify: `src/pages/participant/QuizPage.tsx:173-185` e `:233-245`
- Modify: `src/pages/participant/RankingPage.tsx:55-67`
- Modify: `src/pages/participant/SurveyPage.tsx:188-200`
- Modify: `src/pages/public/ChangePinPage.tsx:68-80`
- Modify: `src/pages/public/LoginPage.tsx:91-103`
- Modify: `src/pages/public/RegisterPage.tsx:113-125`
- Modify: `index.html`

**Interfaces:**
- Consumes: `THEME` de `src/theme/current.ts`.
- Produces: `<ThemeAsset kind="loader" size={number} />`, com `kind` do tipo `'loader' | 'waiting' | 'celebrate' | 'quizFail' | 'heroDecor'`. Os demais valores de `kind` chegam na Task 5; nesta tarefa só `loader` está implementado.

- [ ] **Step 1: Escrever a asserção que deve falhar**

Acrescente ao `scripts/check-theme.sh`, antes do `echo "OK"`:

```bash
grep -q 'ThemeAsset' src/theme/assets.tsx || fail "assets.tsx sem ThemeAsset"
LOTTIE=$(grep -rl 'lottie-player' src | wc -l)
[ "$LOTTIE" -eq 0 ] || fail "$LOTTIE arquivos em src ainda usam lottie-player direto"
true
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
bash scripts/check-theme.sh
```

Esperado: `FALHOU: assets.tsx sem ThemeAsset` (o arquivo ainda não existe, então o `grep` falha).

- [ ] **Step 3: Criar `src/theme/assets.tsx` com o `kind` `loader`**

```tsx
import React from 'react';
import { THEME } from './current';

export type AssetKind = 'loader' | 'waiting' | 'celebrate' | 'quizFail' | 'heroDecor';

interface ThemeAssetProps {
  kind: AssetKind;
  size?: number;
  className?: string;
}

const PokeballLoader: React.FC<{ size: number }> = ({ size }) => (
  <div
    style={{ width: size, height: size }}
    dangerouslySetInnerHTML={{
      __html: `<lottie-player
        src="/Pokeball Loading.json"
        background="transparent"
        speed="1.2"
        style="width: 100%; height: 100%;"
        loop
        autoplay
      ></lottie-player>`,
    }}
  />
);

const RingLoader: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" role="img" aria-label="Carregando">
    <circle
      cx="25" cy="25" r="20" fill="none" strokeWidth="4"
      stroke="rgb(var(--c-border))"
    />
    <circle
      cx="25" cy="25" r="20" fill="none" strokeWidth="4" strokeLinecap="round"
      stroke="rgb(var(--c-primary))"
      strokeDasharray="90 126"
    >
      <animateTransform
        attributeName="transform" type="rotate"
        from="0 25 25" to="360 25 25"
        dur="0.9s" repeatCount="indefinite"
      />
    </circle>
  </svg>
);

export const ThemeAsset: React.FC<ThemeAssetProps> = ({ kind, size = 100, className }) => {
  if (kind === 'loader') {
    return (
      <div className={className}>
        {THEME === 'cyber' ? <PokeballLoader size={size} /> : <RingLoader size={size} />}
      </div>
    );
  }
  return null;
};
```

- [ ] **Step 4: Trocar os 12 blocos de lottie por `ThemeAsset`**

Em cada um dos 11 arquivos listados acima, substitua o bloco

```tsx
      <div
        style={{ width: 100, height: 100 }}
        dangerouslySetInnerHTML={{
          __html: `<lottie-player ... ></lottie-player>`
        }}
      />
```

por

```tsx
      <ThemeAsset kind="loader" size={100} />
```

Preserve o `size` que cada ponto já usava — alguns usam 100, confira caso a caso. Acrescente em cada arquivo o import:

```tsx
import { ThemeAsset } from '../../theme/assets';
```

Em `src/routes/index.tsx` o caminho relativo é `'../theme/assets'`.

O texto do `PageLoader` em `src/routes/index.tsx` fica como está nesta tarefa; ele passa a usar `copy.loading` na Task 6.

- [ ] **Step 5: Colocar os dois loaders no shell do `index.html`**

O plugin do Vite já remove o `<script>` do lottie no tema feira; falta o markup do shell. Substitua o `<lottie-player>` do `<div id="shell">` por:

```html
      <div id="shell-loader-cyber">
        <lottie-player
          src="/Pokeball Loading.json"
          background="transparent"
          speed="1.2"
          style="width: 100px; height: 100px;"
          loop
          autoplay
        ></lottie-player>
      </div>
      <svg id="shell-loader-feira" width="72" height="72" viewBox="0 0 50 50" aria-hidden="true">
        <circle cx="25" cy="25" r="20" fill="none" stroke="#dde3f0" stroke-width="4" />
        <circle cx="25" cy="25" r="20" fill="none" stroke="#950f29" stroke-width="4"
                stroke-linecap="round" stroke-dasharray="90 126">
          <animateTransform attributeName="transform" type="rotate"
                            from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite" />
        </circle>
      </svg>
```

E ao `<style>` inline acrescente:

```css
      [data-theme="cyber"] #shell-loader-feira { display: none; }
      [data-theme="feira"] #shell-loader-cyber { display: none; }
```

- [ ] **Step 6: Rodar a asserção e confirmar que passa**

```bash
bash scripts/check-theme.sh
```

Esperado: `OK`.

- [ ] **Step 7: Verificar os dois builds e o peso do bundle**

```bash
VITE_THEME=cyber npm run build && VITE_THEME=feira npm run build && npm run lint
grep -c 'lottiefiles' dist/index.html || echo "0 (esperado)"
```

Esperado: builds sem erro; zero referências ao lottie no `dist/index.html` do tema feira.

- [ ] **Step 8: Conferir os loaders na tela**

Rode `VITE_THEME=feira npm run dev`, navegue para uma rota lazy (`/quests`, `/ranking`) e confirme que o anel gira. Depois `VITE_THEME=cyber npm run dev` e confirme que a Pokébola voltou.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: componente ThemeAsset e loader por tema

Centraliza os 12 blocos de lottie-player espalhados por 11 arquivos num
componente unico. No tema feira o loader vira um anel SVG inline e o
script do lottie-player deixa de ser carregado do CDN.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Assets restantes e fundo

Substitui os GIFs de anime e o fundo escuro de 1,4 MB.

**Files:**
- Modify: `src/theme/assets.tsx`
- Modify: `src/pages/participant/DashboardPage.tsx:19,296`
- Modify: `src/pages/participant/QuestsPage.tsx:14-15,151,213`
- Modify: `src/pages/participant/QuizPage.tsx:11-12,271`
- Modify: `src/pages/participant/RankingPage.tsx:10,90`
- Modify: `src/pages/public/LoginPage.tsx:10`
- Modify: `src/pages/public/RegisterPage.tsx:10`
- Modify: `src/pages/public/LandingPage.tsx:31-35,157-181`
- Create: `public/favicon-feira.svg`
- Modify: `index.html`
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: `ThemeAsset` da Task 4.
- Produces: `kind` `waiting`, `celebrate`, `quizFail` e `heroDecor` implementados.

- [ ] **Step 1: Escrever a asserção que deve falhar**

Acrescente ao `scripts/check-theme.sh`, antes do `echo "OK"`:

```bash
GIFS=$(grep -rl "assets/.*\.gif" src | wc -l)
[ "$GIFS" -eq 1 ] || fail "esperava os gifs importados so em assets.tsx, achei em $GIFS arquivos"
grep -q 'favicon-feira' index.html || fail "index.html sem favicon do tema feira"
true
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
bash scripts/check-theme.sh
```

Esperado: `FALHOU: esperava os gifs importados so em assets.tsx, achei em 6 arquivos`.

- [ ] **Step 3: Mover os GIFs para dentro de `assets.tsx`**

Acrescente ao topo de `src/theme/assets.tsx`:

```tsx
import nika from '../assets/nika.gif';
import agree from '../assets/agree.gif';
import random3 from '../assets/random3.gif';
```

E as variantes do tema feira, mais os ramos que faltavam no componente:

```tsx
const EmptyState: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 96 96" role="img" aria-label="Nada por aqui ainda">
    <rect x="14" y="26" width="68" height="48" rx="8"
          fill="rgb(var(--c-surface))" stroke="rgb(var(--c-border))" strokeWidth="3" />
    <path d="M14 42h68" stroke="rgb(var(--c-border))" strokeWidth="3" />
    <circle cx="28" cy="34" r="3" fill="rgb(var(--c-muted))" />
    <rect x="26" y="52" width="30" height="5" rx="2.5" fill="rgb(var(--c-border))" />
    <rect x="26" y="62" width="18" height="5" rx="2.5" fill="rgb(var(--c-border))" />
  </svg>
);

const SuccessSeal: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 96 96" role="img" aria-label="Concluído">
    <circle cx="48" cy="48" r="40" fill="rgb(var(--c-primary))" />
    <circle cx="48" cy="48" r="32" fill="none" stroke="rgb(var(--c-highlight))" strokeWidth="3" />
    <path d="M33 49l11 11 20-22" fill="none" stroke="rgb(var(--c-highlight))"
          strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RetryMark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 96 96" role="img" aria-label="Não foi dessa vez">
    <circle cx="48" cy="48" r="40" fill="rgb(var(--c-surface))"
            stroke="rgb(var(--c-border))" strokeWidth="3" />
    <path d="M62 40a18 18 0 10-2 20" fill="none" stroke="rgb(var(--c-muted))"
          strokeWidth="6" strokeLinecap="round" />
    <path d="M62 28v14h-14" fill="none" stroke="rgb(var(--c-muted))"
          strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HeroPolygons: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 400 300" className={className} aria-hidden="true">
    <polygon points="40,250 130,60 210,250" fill="rgb(var(--c-primary))" opacity="0.9" />
    <polygon points="150,250 240,110 330,250" fill="rgb(var(--c-secondary))" opacity="0.85" />
    <polygon points="230,250 300,150 370,250" fill="rgb(var(--c-highlight))" />
    <polygon points="95,250 155,165 215,250" fill="rgb(var(--c-accent))" opacity="0.75" />
  </svg>
);
```

Estenda o corpo de `ThemeAsset`, mantendo o ramo de `loader` já existente:

```tsx
  const gif: Partial<Record<AssetKind, string>> = {
    waiting: nika,
    celebrate: agree,
    quizFail: random3,
  };

  if (kind === 'heroDecor') {
    return THEME === 'cyber' ? null : <HeroPolygons className={className} />;
  }

  if (THEME === 'cyber') {
    const src = gif[kind];
    if (!src) return null;
    return <img src={src} alt="" className={className} draggable={false} />;
  }

  const Feira = { waiting: EmptyState, celebrate: SuccessSeal, quizFail: RetryMark }[kind];
  return Feira ? <div className={className}><Feira size={size} /></div> : null;
```

No tema cyber, `heroDecor` devolve `null` porque a landing continua com os seus cinco GIFs decorativos próprios, tratados no passo seguinte.

- [ ] **Step 4: Trocar os usos de GIF nas páginas**

Nos seis arquivos, remova o import do GIF e troque a tag. Padrão da substituição:

```tsx
<img src={nika} alt="Aguardando" className="w-24 h-auto" draggable={false} />
```

vira

```tsx
<ThemeAsset kind="waiting" size={96} className="w-24" />
```

E `agree` vira `kind="celebrate"`, `random3` vira `kind="quizFail"`. Em `QuizPage.tsx:271` a expressão é ternária:

```tsx
              src={isPassing ? agree : random3}
```

Troque o `<img>` inteiro por:

```tsx
              <ThemeAsset kind={isPassing ? 'celebrate' : 'quizFail'} size={80} className="w-20" />
```

Em `LoginPage.tsx` e `RegisterPage.tsx` os imports de `nika` e `agree` existem mas confira se são de fato usados no JSX; se não forem, apenas remova o import.

- [ ] **Step 5: Tratar os cinco GIFs decorativos da landing**

Em `src/pages/public/LandingPage.tsx`, os cinco `<img>` de `random1`…`random5` entre as linhas 157 e 181 são decoração de fundo. Envolva o bloco inteiro dos cinco em:

```tsx
        {THEME === 'cyber' && (
          <>
            {/* os cinco <img> existentes, sem alteração */}
          </>
        )}

        {THEME === 'feira' && (
          <ThemeAsset kind="heroDecor" className="absolute right-0 bottom-0 w-2/3 max-w-xl opacity-90 pointer-events-none" />
        )}
```

Acrescente ao topo do arquivo:

```tsx
import { THEME } from '../../theme/current';
import { ThemeAsset } from '../../theme/assets';
```

Este é o único ponto do plano com condicional de tema em JSX. Justifica-se porque não é troca de um asset por outro, e sim de cinco elementos posicionados individualmente por um só.

- [ ] **Step 6: Criar o favicon do tema feira**

Crie `public/favicon-feira.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#950F29"/>
  <path d="M20 46V18h13a9 9 0 0 1 0 18h-5l10 10h-8L20 36h13a4 4 0 0 0 0-8h-8v18z" fill="#FFFFFF"/>
</svg>
```

Em `index.html`, deixe o link do favicon com o arquivo do tema cyber e faça o plugin trocá-lo. Em `vite.config.ts`, dentro do `if (theme === 'feira')` do `themeHtml`, acrescente:

```ts
          .replace('href="/favicon.svg"', 'href="/favicon-feira.svg"')
```

- [ ] **Step 7: Aliviar o fundo pesado**

O `Background.webp` de 1,4 MB já só é referenciado sob `[data-theme="cyber"]` desde a Task 3, tanto no `decor.css` quanto no CSS crítico do `index.html`. Confirme:

```bash
grep -rn 'Background.webp' src index.html
```

Esperado: toda ocorrência aparece dentro de uma regra escopada por `[data-theme="cyber"]`. Se alguma estiver fora, escope-a.

- [ ] **Step 8: Rodar a asserção e confirmar que passa**

```bash
bash scripts/check-theme.sh
```

Esperado: `OK`.

- [ ] **Step 9: Verificar os dois builds**

```bash
VITE_THEME=cyber npm run build && VITE_THEME=feira npm run build && npm run lint
```

- [ ] **Step 10: Conferir na tela**

Rode `VITE_THEME=feira npm run dev` e visite `/`, `/quests`, `/quiz` e `/ranking`. Nenhum GIF de anime deve aparecer; os estados vazios e de sucesso mostram as ilustrações novas; a landing mostra os polígonos. Depois confira em `VITE_THEME=cyber` que tudo voltou ao original.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: assets do tema feira substituem os gifs de anime

Estados vazio, de sucesso e de erro do quiz ganham ilustracoes SVG, e a
decoracao da landing passa a usar os poligonos angulares da identidade da
feira. O fundo escuro de 1,4 MB e o favicon roxo ficam restritos ao tema
cyber.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Rótulos textuais por tema

Suaviza o vocabulário de jogo sem tocar na mecânica nem nos termos de negócio.

**Files:**
- Create: `src/theme/copy.ts`
- Modify: `index.html`
- Modify: `src/components/layout/Layout.tsx:26,55,110`
- Modify: `src/pages/participant/QuestsPage.tsx`
- Modify: `src/pages/admin/MissionsPage.tsx`
- Modify: `src/pages/admin/MissionFormPage.tsx`
- Modify: `src/pages/public/LandingPage.tsx`

**Interfaces:**
- Consumes: `THEME` de `src/theme/current.ts`.
- Produces: objeto `copy` com as chaves `missions`, `missionsSingular`, `adminMenu` e `loading`. As taglines do `index.html` não entram aqui: aquele arquivo é estático e é tratado pelo plugin do Vite no Step 6.

- [ ] **Step 1: Escrever a asserção que deve falhar**

Acrescente ao `scripts/check-theme.sh`, antes do `echo "OK"`:

```bash
grep -q 'export const copy' src/theme/copy.ts || fail "copy.ts sem export copy"
grep -q 'Sorteio Gamificado' index.html && fail "index.html ainda diz Sorteio Gamificado"
grep -q 'Iniciando sistema' index.html && fail "index.html ainda diz Iniciando sistema"
true
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
bash scripts/check-theme.sh
```

Esperado: `FALHOU: copy.ts sem export copy`.

- [ ] **Step 3: Criar `src/theme/copy.ts`**

```ts
import { THEME } from './current';

const cyber = {
  missions: 'Missões',
  missionsSingular: 'Missão',
  adminMenu: 'Menu Administrativo',
  loading: 'Carregando recursos...',
};

const feira = {
  missions: 'Desafios',
  missionsSingular: 'Desafio',
  adminMenu: 'Administração',
  loading: 'Carregando',
};

export const copy = THEME === 'cyber' ? cyber : feira;
```

"Cupons" permanece em ambos os temas: já é termo neutro, e trocá-lo obrigaria a mexer em textos que o painel administrativo e o backend também usam.

- [ ] **Step 4: Aplicar os rótulos no `Layout.tsx`**

```tsx
import { copy } from '../../theme/copy';
```

Na linha 26, o item de navegação:

```tsx
    { name: copy.missions, path: '/admin/missions', icon: <Target size={18} /> },
```

Nas linhas 55 e 110, os dois cabeçalhos de barra lateral, que hoje dizem `Menu Administrativo`:

```tsx
              {copy.adminMenu}
```

- [ ] **Step 4b: Aplicar `copy.loading` no `PageLoader`**

Em `src/routes/index.tsx`, importe `copy` de `'../theme/copy'` e troque o texto fixo do `PageLoader`:

```tsx
      <span className="text-[10px] font-mono text-brand-secondary tracking-widest uppercase animate-pulse">
        {copy.loading}
      </span>
```

- [ ] **Step 5: Aplicar os rótulos nas páginas de missão**

Em `QuestsPage.tsx`, `MissionsPage.tsx`, `MissionFormPage.tsx` e `LandingPage.tsx`, localize os textos visíveis:

```bash
grep -rn 'Missões\|Missão' src/pages src/components
```

Troque cada ocorrência que é texto de interface por `{copy.missions}` ou `{copy.missionsSingular}`, importando `copy` em cada arquivo. Não troque nomes de variável, rota, chave de objeto nem campo de API — só o que o usuário lê.

- [ ] **Step 6: Ajustar o `index.html`**

Como o `index.html` é estático, use o plugin. Deixe o arquivo com os textos do tema cyber e acrescente ao `if (theme === 'feira')` do `themeHtml` em `vite.config.ts`:

```ts
          .replace(/Rethink3D Raffle — Sorteio Gamificado/g, 'Sorteio Rethink3D · Feira do Empreendedor')
          .replace(/Sorteio Gamificado/g, 'Sorteio Rethink3D · Feira do Empreendedor')
          .replace('// Sorteio Gamificado', 'Sorteio Rethink3D')
          .replace('Iniciando sistema...', 'Carregando')
          .replace(
            'Participe do sorteio gamificado da Rethink3D. Complete missões, acumule cupons e concorra a prêmios exclusivos de impressão 3D em tempo real.',
            'Participe do sorteio da Rethink3D na Feira do Empreendedor. Complete desafios, acumule cupons e concorra a prêmios de impressão 3D.'
          )
          .replace(
            'Complete missões, acumule cupons e concorra a prêmios exclusivos de impressão 3D.',
            'Complete desafios, acumule cupons e concorra a prêmios de impressão 3D.'
          )
          .replace('Sorteio gamificado ao vivo com missões e prêmios 3D.', 'Sorteio ao vivo com desafios e prêmios 3D.')
```

A asserção do Step 1 verifica o `index.html` fonte, que continua com os textos cyber. Ajuste-a para verificar o `dist` em vez da fonte:

```bash
grep -q 'Sorteio Gamificado' index.html || fail "index.html perdeu o texto do tema cyber"
```

- [ ] **Step 7: Rodar a asserção e confirmar que passa**

```bash
bash scripts/check-theme.sh
```

Esperado: `OK`.

- [ ] **Step 8: Verificar os builds e o texto gerado**

```bash
VITE_THEME=feira npm run build && grep -c 'Sorteio Gamificado' dist/index.html || echo "0 (esperado)"
VITE_THEME=cyber npm run build && grep -c 'Sorteio Gamificado' dist/index.html
npm run lint
```

Esperado: zero no build feira, pelo menos um no build cyber.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: rotulos textuais por tema

Suaviza o vocabulario de jogo no tema feira sem tocar na mecanica: Missoes
vira Desafios e as taglines perdem o jargao. Cupons permanece, por ja ser
termo neutro e por ser compartilhado com o painel admin e o backend.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Converter as cores fixas em tokens

Os 54 valores hexadecimais escritos direto no JSX não respondem à troca de tema e produziriam elementos escuros no tema claro.

**Files:**
- Modify: `src/pages/admin/SurveyResultsPage.tsx` — 13 ocorrências
- Modify: `src/pages/admin/FeedbackResultsPage.tsx` — 13 ocorrências
- Modify: `src/components/draw/PrizeWheel.tsx` — 2 ocorrências
- Modify: `src/pages/participant/DrawWatchPage.tsx` — 1 ocorrência
- Modify: `src/components/ui/Button.tsx` — 1 ocorrência

**Interfaces:**
- Consumes: variáveis da Task 1.
- Produces: nenhum símbolo novo.

- [ ] **Step 1: Escrever a asserção que deve falhar**

Acrescente ao `scripts/check-theme.sh`, antes do `echo "OK"`:

```bash
HEX=$(grep -roE '#[0-9a-fA-F]{6}' src --include=*.tsx | wc -l)
[ "$HEX" -eq 0 ] || fail "restaram $HEX cores hexadecimais fixas em .tsx"
true
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
bash scripts/check-theme.sh
```

Esperado: `FALHOU: restaram 54 cores hexadecimais fixas em .tsx`.

- [ ] **Step 3: Mapear cada hex ao seu token**

A tabela de conversão, derivada da paleta cyber original:

| Hex | Token | Como escrever |
|---|---|---|
| `#0a0a0f` | bg | `rgb(var(--c-bg))` |
| `#12121e` | surface | `rgb(var(--c-surface))` |
| `#1e1e3a` | border | `rgb(var(--c-border))` |
| `#7c3aed` | primary | `rgb(var(--c-primary))` |
| `#a855f7` | glow | `rgb(var(--c-glow))` |
| `#06b6d4` | secondary | `rgb(var(--c-secondary))` |
| `#f59e0b` | accent | `rgb(var(--c-accent))` |
| `#10b981` | success | `rgb(var(--c-success))` |
| `#ef4444` | danger | `rgb(var(--c-danger))` |
| `#e2e8f0` | text | `rgb(var(--c-text))` |
| `#64748b` | muted | `rgb(var(--c-muted))` |

- [ ] **Step 4: Converter as duas páginas de resultado**

Em `SurveyResultsPage.tsx` e `FeedbackResultsPage.tsx` os hex alimentam o Recharts. Substitua o array de cores por um que leia as variáveis:

```tsx
const CHART_COLORS = [
  'rgb(var(--c-primary))',
  'rgb(var(--c-secondary))',
  'rgb(var(--c-accent))',
  'rgb(var(--c-success))',
  'rgb(var(--c-danger))',
  'rgb(var(--c-glow))',
];
```

O Recharts renderiza em SVG dentro do documento, então `var()` resolve normalmente. Converta também as props avulsas de `stroke`, `fill` e `tick` que usam hex, conforme a tabela do Step 3.

- [ ] **Step 5: Converter os três pontos restantes**

`PrizeWheel.tsx` (2), `DrawWatchPage.tsx` (1) e `Button.tsx` (1). No `Button.tsx` o hex está no gradiente de listras do estado desabilitado:

```tsx
            backgroundImage: 'repeating-linear-gradient(45deg, rgb(var(--c-border)), rgb(var(--c-border)) 5px, transparent 5px, transparent 10px)'
```

- [ ] **Step 6: Rodar a asserção e confirmar que passa**

```bash
bash scripts/check-theme.sh
```

Esperado: `OK`.

- [ ] **Step 7: Verificar os builds e os gráficos**

```bash
VITE_THEME=cyber npm run build && VITE_THEME=feira npm run build && npm run lint
```

Rode `npm run dev` nos dois temas e abra `/admin/survey-results` e `/admin/feedback-results`. Os gráficos precisam ter cor em ambos — Recharts com cor vazia renderiza fatias pretas ou invisíveis.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: converte as 54 cores fixas em .tsx para tokens de tema

Valores hexadecimais escritos direto no JSX nao respondem a troca de tema
e apareceriam como elementos escuros no tema claro. Inclui as cores dos
graficos do Recharts nas paginas de resultado.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Varredura de contraste, página a página

A etapa mais longa. O modo claro expõe combinações que hoje só existem sobre fundo escuro: texto branco fixo, sobreposições translúcidas calibradas para o preto, badges com texto claro sobre preenchimento claro.

**Files:**
- Modify: conforme necessário, entre os 37 arquivos com token de tema.

**Interfaces:**
- Consumes: tudo das tarefas anteriores.
- Produces: nenhum símbolo novo.

**Procedimento para cada página, sem exceção:**

1. Rodar `VITE_THEME=feira npm run dev` e abrir a rota.
2. Procurar por três defeitos específicos:
   - `text-white` sobre preenchimento claro. Localizar com `grep -n 'text-white' <arquivo>`; sobre `bg-brand-highlight`, `bg-brand-surface` ou fundo branco, trocar por `text-brand-text`.
   - Sobreposições `bg-black/…` e `backdrop-blur`, calibradas para fundo preto. Trocar `bg-black/80` por `bg-brand-text/40` nos backdrops de modal.
   - Preenchimentos `/10` de cor sobre fundo claro, que quase somem. Onde o elemento precisa de presença, subir para `/12` com borda `/40`.
3. Ao terminar a página, conferir a mesma rota em `VITE_THEME=cyber` e confirmar que nada regrediu.
4. Commitar a página.

- [ ] **Step 1: Levantar os pontos de risco de uma vez**

```bash
echo "--- text-white ---"; grep -rn 'text-white' src | wc -l
echo "--- bg-black ---";   grep -rn 'bg-black' src | wc -l
echo "--- hover:text-black ---"; grep -rn 'text-black' src | wc -l
```

Anote os números; eles devem cair ao longo da tarefa e a contagem final entra no Step 13.

- [ ] **Step 2: Primitivos de interface**

`src/components/ui/Button.tsx`, `Card.tsx`, `Input.tsx`, `Modal.tsx`, `ConfirmDialogHost.tsx`, `ImageUploadField.tsx`. São a base de tudo; corrigir aqui resolve boa parte das páginas. Atenção especial ao `Button`: as variantes `secondary` e `accent` usam `hover:text-black`, que no tema claro fica correto, e `primary` usa `text-white` sobre `bg-brand-primary/10` — no tema claro isso é branco sobre quase-branco. Troque para `text-brand-primary` e mantenha `hover:text-white` sobre o preenchimento sólido.

Verificar: `npm run dev` nos dois temas, conferindo um botão de cada variante. Commit.

- [ ] **Step 3: Layout e cabeçalho**

`src/components/layout/Layout.tsx`, `Header.tsx`. O `Header` usa `text-white` no nome do usuário e o `Layout` usa `text-white` no item ativo da barra lateral. Commit.

- [ ] **Step 4: Landing**

`src/pages/public/LandingPage.tsx`. Maior página do projeto, com 67 tokens. Confira o hero, os passos, o ranking e o FAQ. Commit.

- [ ] **Step 5: Autenticação**

`LoginPage.tsx`, `RegisterPage.tsx`, `ChangePinPage.tsx`, `admin/AdminLoginPage.tsx`. Commit.

- [ ] **Step 6: Dashboard e missões do participante**

`participant/DashboardPage.tsx` (99 tokens), `QuestsPage.tsx`, `components/quest/QuestCard.tsx`, `PrintUpload.tsx`, `ReferralRedeem.tsx`. Commit.

- [ ] **Step 7: Quiz, feedback e pesquisa**

`participant/QuizPage.tsx`, `FeedbackPage.tsx`, `SurveyPage.tsx`. Commit.

- [ ] **Step 8: Sorteio e ranking do participante**

`participant/DrawWatchPage.tsx`, `RankingPage.tsx`, `components/draw/PrizeWheel.tsx`, `components/ranking/Leaderboard.tsx`. A roleta e o `Leaderboard` têm muito preenchimento translúcido. Commit.

- [ ] **Step 9: Painel administrativo, parte um**

`admin/AdminDashboard.tsx`, `CampaignsPage.tsx`, `MissionsPage.tsx`, `MissionFormPage.tsx` (85 tokens). Commit.

- [ ] **Step 10: Painel administrativo, parte dois**

`admin/ParticipantsPage.tsx`, `ParticipantProofsPage.tsx`, `PrizesPage.tsx`, `RankingPage.tsx`. Commit.

- [ ] **Step 11: Controle de sorteio**

`admin/DrawControlPage.tsx` — 148 tokens, o arquivo mais denso do projeto. Reserve tempo. Commit.

- [ ] **Step 12: Páginas de resultado**

`admin/SurveyResultsPage.tsx`, `FeedbackResultsPage.tsx`. Já tiveram as cores de gráfico convertidas na Task 7; aqui é o resto da página. Commit.

- [ ] **Step 13: Conferir a queda dos números de risco**

```bash
echo "--- text-white ---"; grep -rn 'text-white' src | wc -l
echo "--- bg-black ---";   grep -rn 'bg-black' src | wc -l
```

Esperado: ambos abaixo dos valores do Step 1. As ocorrências restantes devem estar sobre preenchimento sólido escuro — confira uma a uma que sobreviveu por bom motivo.

---

### Task 9: Fechamento

**Files:**
- Modify: `README.md`
- Modify: `netlify.toml`
- Delete: `scripts/check-theme.sh`

- [ ] **Step 1: Documentar a variável no `README.md`**

Na seção "Configuração", substitua o bloco de `.env` por:

````markdown
```bash
VITE_API_URL=
VITE_SOCKET_URL=
VITE_THEME=feira
```

`VITE_THEME` escolhe a identidade visual no build. `feira` aplica o tema sóbrio alinhado à Feira do Empreendedor do Sebrae; `cyber` aplica o tema gamificado original. Ausente ou com valor desconhecido, resolve para `feira`. Trocar de tema exige novo build e novo deploy.
````

Acrescente à seção "Arquitetura" uma subseção descrevendo `src/theme/`.

- [ ] **Step 2: Fixar o tema no deploy**

Em `netlify.toml`, declare a variável no ambiente de build para o valor não depender do que estiver configurado no painel:

```toml
[build.environment]
  VITE_THEME = "feira"
```

Se o arquivo já tiver uma seção `[build.environment]`, acrescente a linha nela em vez de criar outra.

- [ ] **Step 3: Verificação final completa**

```bash
VITE_THEME=cyber npm run build
VITE_THEME=feira npm run build
npm run lint
```

Esperado: nenhum erro. Anote o tamanho do bundle dos dois — o tema feira deve ser menor, por não carregar o `Background.webp` de 1,4 MB nem o script do lottie.

- [ ] **Step 4: Remover o script de verificação**

Ele cumpriu a função de portão durante a implementação e não pertence ao repositório em regime permanente.

```bash
rm scripts/check-theme.sh
rmdir scripts 2>/dev/null || true
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
docs: documenta VITE_THEME e fixa o tema no deploy

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: Relatar ao autor do projeto**

Entregar: nome da branch, lista dos commits, tamanho dos dois bundles, e a pendência em aberto das marcas do Sebrae registrada na spec — os logotipos do evento não foram usados por falta do kit de marca oficial.

---

## Pendência herdada da spec

Os logotipos do Sebrae e da Feira do Empreendedor são marcas registradas, e as fotografias do site do evento são banco de imagem licenciado. Este plano aplica apenas a linguagem visual — paleta, tipografia, formas — que não depende de autorização. Se o kit de marca oficial for fornecido, a integração dos logotipos é trabalho adicional, fora deste plano.
