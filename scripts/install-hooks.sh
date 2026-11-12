#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  printf 'Error: ejecuta este script dentro de un repositorio Git.\n' >&2
  exit 1
}

cd "$ROOT_DIR"
HOOKS_PATH=".githooks"
HOOK_PATH="${HOOKS_PATH}/pre-push"

if [[ ! -f "$HOOK_PATH" ]]; then
  printf 'Error: no existe el hook esperado: %s\n' "$HOOK_PATH" >&2
  exit 1
fi

if [[ ! -x "$HOOK_PATH" ]]; then
  printf 'Aviso: el hook %s no tiene permisos de ejecución; se corregirán.\n' "$HOOK_PATH" >&2
  chmod +x "$HOOK_PATH"
fi

current_path="$(git config --local --get core.hooksPath || true)"
if [[ -n "$current_path" && "$current_path" != "$HOOKS_PATH" ]]; then
  printf 'Aviso: core.hooksPath local cambiará de %s a %s para este repositorio.\n' "$current_path" "$HOOKS_PATH" >&2
fi

git config --local core.hooksPath "$HOOKS_PATH"

if [[ "$(git config --local --get core.hooksPath)" != "$HOOKS_PATH" ]]; then
  printf 'Error: no se pudo verificar core.hooksPath.\n' >&2
  exit 1
fi

printf 'Hook pre-push instalado para este repositorio en %s.\n' "$HOOK_PATH"
printf 'Es opcional y no reemplaza las validaciones obligatorias de GitHub Actions.\n'
