#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v pnpm >/dev/null 2>&1; then
  printf 'Error: pnpm no está instalado o no está en PATH.\n' >&2
  exit 1
fi

cd "$ROOT_DIR"
printf 'Auditando dependencias del workspace con pnpm...\n'

if pnpm audit --audit-level high; then
  printf 'Auditoría completada: no se detectaron vulnerabilidades high o critical.\n'
else
  status=$?
  printf 'La auditoría de dependencias falló (código %s). Revisa los paquetes, severidades y versiones corregidas indicadas arriba; no se aplicaron cambios.\n' "$status" >&2
  exit "$status"
fi
