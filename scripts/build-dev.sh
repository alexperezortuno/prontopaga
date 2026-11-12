#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker/compose.dev.yml"
COMPOSE_ARGS=(-f "$COMPOSE_FILE")

if [[ -f "${ROOT_DIR}/.env" ]]; then
  COMPOSE_ARGS+=(--env-file "${ROOT_DIR}/.env")
fi

if ! command -v docker >/dev/null 2>&1; then
  printf 'Error: Docker no está instalado o no está en PATH.\n' >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  printf 'Error: Docker Compose Plugin no está disponible.\n' >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  printf 'Error: Docker Engine no está accesible. Verifica el daemon y los permisos.\n' >&2
  exit 1
fi

case "${1:-all}" in
  all)
    SERVICES=(api web)
    ;;
  api|web)
    SERVICES=("$1")
    ;;
  *)
    printf 'Uso: %s [api|web]\n' "$0" >&2
    exit 2
    ;;
esac

printf 'Construyendo imágenes de development: %s\n' "${SERVICES[*]}"
docker compose "${COMPOSE_ARGS[@]}" build "${SERVICES[@]}"
printf 'Construcción development completada.\n'
