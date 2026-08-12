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
[ "$BRAND" -ge 1214 ] || fail "esperava ao menos 1214 tokens brand-*, achei $BRAND"

grep -rq 'font-orbitron\|font-rajdhani\|font-inter' src && fail "restaram nomes de fonte antigos"
grep -rq 'clip-cyber' src && fail "restaram classes clip-cyber mortas"

grep -q 'hud-corner' src/theme/decor.css || fail "decor.css sem hud-corner"
grep -q 'keep-caps' src/theme/decor.css || fail "decor.css sem escape keep-caps"
grep -q 'hud-corner' src/components/ui/Card.tsx || fail "Card sem hud-corner"
grep -q "theme/decor.css" src/main.tsx || fail "main.tsx nao importa decor.css"
grep -q 'glow-primary' src/theme/decor.css || fail "decor.css sem os utilitarios de brilho"
grep -q '^\.glow-primary' src/index.css && fail "utilitarios de brilho ainda no index.css"

echo "OK"
