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
