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

LEFT=$(grep -ro 'cyber-\(bg\|surface\|border\|primary\|glow\|secondary\|accent\|success\|danger\|text\|muted\)\b' src | wc -l)
[ "$LEFT" -eq 0 ] || fail "restaram $LEFT tokens cyber-* nao renomeados"

BRAND=$(grep -ro 'brand-\(bg\|surface\|border\|primary\|glow\|secondary\|accent\|highlight\|success\|danger\|text\|muted\)\b' src | wc -l)
[ "$BRAND" -ge 1212 ] || fail "esperava ao menos 1212 tokens brand-*, achei $BRAND"

grep -rq 'font-orbitron\|font-rajdhani\|font-inter' src && fail "restaram nomes de fonte antigos"
grep -rq 'clip-cyber' src && fail "restaram classes clip-cyber mortas"

grep -q 'hud-corner' src/theme/decor.css || fail "decor.css sem hud-corner"
grep -q 'keep-caps' src/theme/decor.css || fail "decor.css sem escape keep-caps"
grep -q 'hud-corner' src/components/ui/Card.tsx || fail "Card sem hud-corner"
grep -q "theme/decor.css" src/main.tsx || fail "main.tsx nao importa decor.css"
grep -q 'glow-primary' src/theme/decor.css || fail "decor.css sem os utilitarios de brilho"
grep -q '^\.glow-primary' src/index.css && fail "utilitarios de brilho ainda no index.css"

grep -q 'ThemeAsset' src/theme/assets.tsx || fail "assets.tsx sem ThemeAsset"
LOTTIE=$(grep -rl 'lottie-player' src --include=*.tsx | grep -v 'src/theme/assets.tsx' | wc -l)
[ "$LOTTIE" -eq 0 ] || fail "$LOTTIE arquivos em src ainda usam lottie-player direto"

for f in $(grep -rl "assets/.*\.gif" src); do
  case "$f" in
    src/theme/assets.tsx) continue ;;
  esac
  grep -q "THEME === 'cyber'" "$f" || fail "$f usa gif sem guarda de tema"
done
grep -q 'favicon-feira' vite.config.ts || fail "vite sem troca de favicon no tema feira"

grep -q 'export const copy' src/theme/copy.ts || fail "copy.ts sem export copy"
grep -q 'Sorteio Gamificado' index.html || fail "index.html perdeu o texto do tema cyber"
grep -q 'copy.adminMenu' src/components/layout/Layout.tsx || fail "Layout nao usa copy.adminMenu"
grep -q 'copy.loading' src/routes/index.tsx || fail "PageLoader nao usa copy.loading"

HEX=$(grep -roE '#[0-9a-fA-F]{6}' src --include=*.tsx | wc -l)
[ "$HEX" -eq 0 ] || fail "restaram $HEX cores hexadecimais fixas em .tsx"

echo "OK"
