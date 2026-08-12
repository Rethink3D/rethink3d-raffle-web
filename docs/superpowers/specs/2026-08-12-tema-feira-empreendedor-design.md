# Tema "Feira do Empreendedor" — design

Data: 2026-08-12
Projeto: `rethink3d-raffle-web`
Status: aprovado

## Problema

O site do sorteio tem identidade visual gamificada (cyberpunk/anime): paleta roxo-neon sobre fundo preto, tipografia Orbitron/Rajdhani em caixa alta com espaçamento largo, brilhos neon, molduras de HUD, GIFs de anime e um loader de Pokébola. A campanha vai rodar durante a Feira do Empreendedor do Sebrae, um evento de negócios. A identidade atual destoa do contexto.

O tema atual não deve ser descartado — a Rethink3D volta a usá-lo em campanhas de perfil geek. Precisamos de dois temas coexistindo, com escolha no build.

## Escopo

Reskin completo do tema visual, com sistema de dois temas trocável por variável de ambiente. Sem mudança de funcionalidade, rotas, contratos de API ou modelo de dados.

Fora de escopo: backend (`rethink3d-raffle-api`), qualquer outro repositório do `C:\Rethink`.

## Levantamento do estado atual

O tema está expresso em quatro camadas, com volumes muito diferentes:

| Camada | Volume medido | Estratégia |
|---|---|---|
| Cores `cyber-*` (Tailwind) | 1233 ocorrências em 37 arquivos | Variáveis CSS |
| Fontes `font-orbitron` / `font-rajdhani` / `font-inter` | 330 ocorrências | Variáveis CSS |
| Tipografia gamer: `uppercase` (276), `tracking-*` (292), `font-mono` (194) | 762 ocorrências | Override CSS por seletor de tema |
| Decoração estrutural: molduras de HUD, brilhos, scanlines, grade, relâmpagos | JSX e CSS fixos | Neutralização por CSS |
| Assets: 7 GIFs, `Pokeball Loading.json`, `Background.webp`, favicon | ~10 arquivos | Componente `ThemeAsset` |
| Copy gamer: "Sorteio Gamificado", "Iniciando sistema...", "Missões" | `index.html` e páginas | Módulo `theme/copy.ts` |
| Cores hex fixas em `.tsx` | 54 ocorrências | Converter para token |

Achado relevante: as classes `clip-cyber-btn` e `clip-cyber-card` são referenciadas em quatro lugares (`Button.tsx`, `Card.tsx`, `Modal.tsx`, `QuestCard.tsx`) mas nunca definidas em `index.css` nem no `tailwind.config.js`. São no-ops e serão removidas.

Ponto a favor: os nomes de token já são semânticos (`bg`, `surface`, `border`, `primary`, `glow`, `secondary`, `accent`, `success`, `danger`, `text`, `muted`), não literais de cor. Isso torna a troca de tema uma troca de valores, não uma reescrita de marcação.

## Identidade extraída da Feira do Empreendedor

Valores obtidos de estilos computados em `sebrae.com.br/subsites/feira-do-empreendedor`.

Paleta:

| Cor | Hex |
|---|---|
| Vinho (hero, destaque) | `#950F29` |
| Navy (texto, headings) | `#1B244B` |
| Azul de ação | `#2A4FDA` |
| Azul institucional | `#005EB8` |
| Lima (CTA de alto destaque) | `#E7F79E` |
| Azul claro (acento) | `#88C9F7` |
| Coral (acento, alerta) | `#F2455A` |
| Cinza-azulado (texto secundário) | `#687499` |
| Branco (fundo) | `#FFFFFF` |

Tipografia: **Figtree**, família única em todo o site. Geométrica humanista, disponível no Google Fonts. Pesos 400 a 800.

Linguagem visual: fundo branco; hero em bloco de cor sólida; cantos arredondados amplos; polígonos angulares sobrepostos às fotografias; fotografia real de pessoas; headings pesados e grandes; ausência total de brilho ou neon; copy sóbria e direta.

## Mapa de papéis semânticos

| Papel | feira | cyber (preservado) | Contraste feira sobre branco |
|---|---|---|---|
| `bg` | `#FFFFFF` | `#0a0a0f` | — |
| `surface` | `#F7F9FF` | `#12121e` | — |
| `border` | `#DDE3F0` | `#1e1e3a` | — |
| `primary` | `#950F29` | `#7c3aed` | 8,9:1 |
| `glow` | `#B31434` | `#a855f7` | 6,5:1 |
| `secondary` | `#2A4FDA` | `#06b6d4` | 5,4:1 |
| `accent` | `#005EB8` | `#f59e0b` | 5,7:1 |
| `highlight` | `#E7F79E` | `#f59e0b` | só fundo |
| `success` | `#2E7D52` | `#10b981` | 5,0:1 |
| `danger` | `#C41E3A` | `#ef4444` | 5,9:1 |
| `text` | `#1B244B` | `#e2e8f0` | 13,9:1 |
| `muted` | `#687499` | `#64748b` | 4,6:1 |

O papel `accent` é usado como cor de texto em 63 pontos do código. A lima `#E7F79E` sobre branco tem contraste de 1,2:1 e seria ilegível nesses pontos. Por isso `accent` no tema feira recebe o azul institucional, e a lima ganha um token novo, `highlight`, destinado exclusivamente a preenchimento de fundo com texto navy por cima — que é exatamente como a feira a usa. O token `highlight` também existe no tema cyber, apontando para o âmbar que já é o `accent` de lá, de modo que nenhum tema fica com token indefinido.

Todos os papéis usados como cor de texto passam no critério AA da WCAG para texto normal sobre o fundo do próprio tema.

## Arquitetura

### Seleção de tema

`.env` ganha `VITE_THEME`, com valores `feira` (padrão) ou `cyber`.

`index.html` declara `<html lang="pt-BR" data-theme="%VITE_THEME%">`. O Vite substitui tokens `%VITE_*%` em `index.html` no build, então o atributo já está correto no shell crítico, antes do React montar. Isso elimina flash de tema errado.

Se `VITE_THEME` não estiver definida, o valor cai para `feira`.

Não há troca em runtime, nem por URL, nem por painel. Trocar de tema exige rebuild e redeploy.

### Estrutura de arquivos

```
src/theme/
  tokens.css     variáveis por tema, um bloco [data-theme] cada
  decor.css      utilitários decorativos e suas neutralizações
  assets.tsx     componente ThemeAsset
  copy.ts        rótulos textuais por tema
```

### Tokens e Tailwind

As variáveis guardam canais RGB crus, não cores completas:

```css
:root[data-theme="feira"] {
  --c-bg: 255 255 255;
  --c-primary: 149 15 41;
}
```

O `tailwind.config.js` consome com `<alpha-value>`:

```js
colors: {
  brand: {
    bg: 'rgb(var(--c-bg) / <alpha-value>)',
    primary: 'rgb(var(--c-primary) / <alpha-value>)',
  }
}
```

Isso é obrigatório: o código usa modificadores de opacidade em volume (`bg-cyber-surface/85`, `border-cyber-primary/60`, `bg-cyber-primary/10`). Guardar a cor pronta em vez dos canais quebraria todos eles.

Tokens tipográficos seguem o mesmo padrão via `--font-display`, `--font-ui`, `--font-body`. No tema feira as três apontam para Figtree; no tema cyber, para Orbitron, Rajdhani e Inter respectivamente.

Token `--radius` controla o raio de canto: amplo no tema feira, contido no cyber.

### Renomeação de namespace

`cyber-*` passa a `brand-*`; `font-orbitron` / `font-rajdhani` / `font-inter` passam a `font-display` / `font-ui` / `font-body`.

Razão: num sistema de dois temas, um token chamado `cyber` que serve o tema `feira` é enganoso para quem for manter o código.

A substituição é mecânica e deve ser ancorada em fronteira de palavra, para não atingir `cyber-grid`, `cyber-panel` nem os `clip-cyber-*`, que são classes CSS e não tokens de cor. Após a substituição, uma varredura por `cyber-` residual confirma que só sobraram as ocorrências pretendidas.

### Neutralização da decoração

O JSX dos componentes não recebe condicionais de tema. A decoração é desligada por CSS, sob o seletor do tema:

- `.glow-primary`, `.glow-secondary`, `.glow-accent` — `box-shadow: none`
- `.text-glow-*` — `text-shadow: none`
- `.cyber-grid` — sem gradientes
- `.hud-corner` — classe nova aplicada às quatro molduras do `Card`; `display: none` no tema feira
- `.animate-lightning-1`, `.animate-lightning-2`, `.animate-lightning-flash` — `display: none`
- barra de rolagem — cinza claro

A tipografia gamer é resolvida por override de utilitário:

```css
[data-theme="feira"] .uppercase:not(.keep-caps) { text-transform: none; }
[data-theme="feira"] .tracking-wide,
[data-theme="feira"] .tracking-wider,
[data-theme="feira"] .tracking-widest { letter-spacing: 0; }
[data-theme="feira"] .font-mono { font-family: var(--font-ui); }
```

A especificidade de `[atributo] .classe` (0,2,0) vence a do utilitário puro do Tailwind (0,1,0), então o override funciona sem `!important`. Isso cobre as 762 ocorrências sem editar nenhuma delas, e deixa o tema cyber intocado.

A classe `.keep-caps` é o escape para siglas e rótulos que precisam de caixa alta real.

As classes mortas `clip-cyber-btn` e `clip-cyber-card` são removidas dos quatro pontos de uso.

### Assets

Componente `<ThemeAsset kind="..." />` resolve o asset conforme o tema ativo.

| `kind` | cyber | feira |
|---|---|---|
| `loader` | `Pokeball Loading.json` via lottie-player | anel SVG inline em vinho |
| `waiting` | `nika.gif` | ilustração SVG de estado vazio |
| `celebrate` | `agree.gif` | selo de check, lima sobre vinho |
| `quizFail` | `random3.gif` | ilustração SVG neutra |
| `heroDecor` | `random1`…`random5.gif` | polígonos angulares sobrepostos em SVG |

O `<script>` do `lottie-player` (CDN unpkg) e o `Background.webp` de 1,4 MB saem do carregamento no tema feira. O fundo passa a ser branco com textura geométrica sutil. O favicon ganha versão em vinho.

Os polígonos angulares reproduzem a linguagem gráfica da feira em SVG puro: sem custo de licença e sem peso de imagem.

### Copy

Rótulos centralizados em `theme/copy.ts`. Só muda o que soa a jogo; termos de negócio permanecem.

| Hoje | Tema feira |
|---|---|
| "Sorteio Gamificado" (título, OG, shell) | "Sorteio Rethink3D · Feira do Empreendedor" |
| "// Iniciando sistema..." | "Carregando" |
| "Missões" | "Desafios" |
| "Cupons" | "Cupons" — mantido |
| "Menu Administrativo" em mono caixa alta | "Administração", peso normal |

"Cupons" foi deliberadamente mantido: já é termo neutro, e trocá-lo exigiria mexer em textos que o admin e o backend também usam.

## Ordem de execução

1. Infraestrutura de tema: `tokens.css`, atributo `data-theme`, variáveis no Tailwind, `VITE_THEME` no `.env`. **Portão de qualidade: o tema cyber deve continuar visualmente idêntico ao atual.** Se regredir, corrigir antes de seguir.
2. Renomeação `cyber-*` para `brand-*` e dos tokens de fonte, com varredura de verificação.
3. `decor.css` e a classe `.hud-corner` no `Card`; remoção das classes `clip-cyber-*`.
4. `ThemeAsset` e os assets do tema feira.
5. `theme/copy.ts` e aplicação dos rótulos.
6. Varredura das 23 páginas corrigindo contraste e convertendo os 54 hex fixos em token. É a etapa mais longa.
7. `npm run build` e `npm run lint` limpos, verificados nos dois valores de `VITE_THEME`.

## Riscos

O modo claro expõe combinações de cor que hoje só existem sobre fundo escuro. Texto `muted` sobre `surface`, badges de estado e sobreposições translúcidas são os pontos prováveis de falha de contraste. Por isso a etapa 6 é uma varredura página a página, não uma conferência por amostragem.

Os 54 valores hex fixos em `.tsx` não respondem à troca de tema. Enquanto não forem convertidos, produzem elementos escuros no tema claro.

A renomeação de 1233 ocorrências é mecânica mas ampla. Mitigação: âncora de fronteira de palavra na substituição, varredura por resíduos depois, e `npm run build` como verificação final.

## Convenções

Código novo sem comentários, conforme preferência registrada do autor do projeto.

## Pendência aberta: marcas do Sebrae

Os logotipos do Sebrae e da Feira do Empreendedor são marcas registradas do Sebrae; as fotografias do site são banco de imagem licenciado por eles. Nada foi baixado.

Este design aplica apenas a linguagem visual — paleta, tipografia, formas — o que não depende de autorização. O uso dos logotipos do evento depende de a Rethink3D ser expositora credenciada e possuir o kit de marca oficial, que deve ser fornecido pelo autor do projeto. Até lá, a landing referencia a presença no evento por texto.

Ativos localizados, caso a autorização se confirme:

```
https://sebrae.com.br/content/dam/portal-sebrae/na/pt/imagens/logo/logo-sebrae.svg
https://sebrae.scene7.com/is/image/sebrae/banner_home
https://sebrae.scene7.com/is/image/sebrae/imagem-destaque-02-15
https://sebrae.scene7.com/is/image/sebrae/image-banner-1
https://sebrae.scene7.com/is/image/sebrae/imagem-destaque-1-7
```
