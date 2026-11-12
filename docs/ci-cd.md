# CI/CD

Este proyecto implementa CI, no despliegue automático. El workflow vive en
`.github/workflows/ci.yml` y se ejecuta en `push` a `main` o `develop`, en pull
requests hacia esas ramas y mediante `workflow_dispatch`.

## Arquitectura del pipeline

El workflow tiene tres jobs:

- `validate`: instala con el lockfile congelado y ejecuta lint, tests y build.
- `security`: instala el workspace y ejecuta la auditoría de pnpm.
- `docker-build`: depende de los dos jobs anteriores y construye las imágenes
  Production, las exporta y publica un artefacto.

El token de GitHub solo tiene `contents: read`. No se usan secretos de
despliegue, registries ni acciones de publicación de imágenes.

## Validaciones

La validación usa Node.js `22.23.2`, pnpm `11.8.0` y:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
```

Una falla detiene el job. No se usa `continue-on-error`.

## Auditoría de dependencias

`security` y el hook local llaman a `scripts/audit-deps.sh`, que ejecuta:

```bash
pnpm audit --audit-level high
```

El umbral bloquea vulnerabilidades `high` y `critical`. La salida de pnpm
incluye el paquete afectado, severidad, ruta de dependencia y versión corregida
cuando el registro la proporciona. La ruta permite identificar dependencias
transitivas. Una salida distinta de cero bloquea `docker-build`; no se ejecuta
`pnpm audit --fix` ni se modifican dependencias automáticamente.

Para interpretar un resultado, revisa primero el paquete directo o transitivo,
el rango afectado y la versión corregida indicada por pnpm. La corrección debe
ser una decisión manual y acompañarse de una actualización del lockfile cuando
corresponda.

## Hook local

Los hooks son opcionales. Para habilitar el hook nativo del repositorio:

```bash
./scripts/install-hooks.sh
```

Esto configura únicamente `core.hooksPath` local como `.githooks`; no cambia la
configuración global y es idempotente. El hook `pre-push` ejecuta la misma
auditoría y bloquea el push si falla. Puede omitirse, y no sustituye los
controles obligatorios de GitHub Actions.

## Construcción de imágenes

`docker-build` usa el contexto raíz y los Dockerfiles existentes:

- `apps/api/Dockerfile.prod` -> `financial-risk-api:<sha-corto>`
- `apps/web/Dockerfile.prod` -> `financial-risk-web:<sha-corto>`

No se usa `latest` como identificador único ni se ejecutan contenedores con
credenciales reales.

## Exportación y empaquetado

Cada imagen se exporta con `docker save` a un TAR. Los TAR y `manifest.json` se
empaquetan en `financial-risk-images-<commit-sha>.zip`. El manifiesto contiene
nombre, tag, commit completo, fecha UTC y plataforma del runner. También se
genera un archivo `.sha256` junto al ZIP.

El ZIP contiene:

```text
financial-risk-api.tar
financial-risk-web.tar
manifest.json
```

No se incluyen `.env`, tokens ni credenciales. El workflow no utiliza
`docker export`.

## Descarga y carga

Desde la ejecución del workflow, descarga el artefacto `financial-risk-images-<commit-sha>`
en la pestaña **Actions** y verifica el checksum:

```bash
sha256sum -c financial-risk-images-<commit-sha>.zip.sha256
unzip financial-risk-images-<commit-sha>.zip
docker load --input financial-risk-api.tar
docker load --input financial-risk-web.tar
```

El artefacto se conserva durante 7 días. Es un ZIP descargable de GitHub
Actions, no una imagen publicada en un registry.

## Limitaciones

- La auditoría depende de la información disponible en el registro de pnpm y
  no reemplaza una revisión de código o de la imagen completa.
- El pipeline no firma imágenes ni artefactos.
- Las imágenes solo se construyen y exportan en CI; no se publican ni despliegan.
- La ejecución real en GitHub Actions y la carga de TAR requieren una ejecución
  del workflow; las validaciones locales no prueban la infraestructura de
  GitHub.
