# Requisitos Y Configuración Local

Este documento complementa el README con la preparación del entorno y los controles de dependencias. Los comandos se ejecutan desde la raíz del repositorio.

## Node.js

Se requiere Node.js 22 LTS o una versión posterior compatible con `package.json`.

Verifica la instalación:

```bash
node --version
```

El proyecto exige Node `>=22.0.0`. No se requiere instalar una base de datos, Docker ni servicios externos.

## Corepack Y pnpm

Corepack es el mecanismo recomendado para activar el gestor declarado por el proyecto:

```bash
corepack enable
corepack prepare pnpm@11.8.0 --activate
pnpm --version
```

La salida esperada de pnpm es `11.8.0`. Si Corepack no está disponible en una distribución concreta de Node, instala pnpm 11.8.0 mediante el mecanismo oficial de pnpm y verifica la misma versión antes de continuar.

## Instalación

```bash
pnpm install --frozen-lockfile
```

`pnpm-lock.yaml` fija las versiones y las integridades resueltas. `--frozen-lockfile` evita que una instalación local modifique el lockfile silenciosamente y hace que un lockfile desactualizado falle de forma visible.

## Variables locales

```bash
cp .env.example .env
```

Configura al menos:

```dotenv
PORT=3000
JWT_SECRET=un-secreto-local-de-al-menos-32-caracteres
VITE_API_URL=http://localhost:3000
```

`JWT_SECRET` es obligatorio para iniciar el API y no debe ser una cadena de ejemplo. Nunca subas `.env` ni secretos reales. Vite solo expone al navegador variables con prefijo `VITE_`, por lo que secretos no deben usar ese prefijo.

## Comandos De Desarrollo

```bash
pnpm dev
```

También es posible iniciar cada aplicación por separado:

```bash
pnpm dev:api
pnpm dev:web
```

Validaciones del workspace:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

## Controles De pnpm

Se utiliza pnpm exclusivamente por estas razones prácticas y de seguridad operacional:

- `pnpm-lock.yaml` permite reproducir la resolución exacta de dependencias.
- El store direccionado por contenido evita duplicación innecesaria y facilita verificar paquetes reutilizados.
- `strict-peer-dependencies=true` hace visibles las incompatibilidades de peer dependencies en lugar de ocultarlas.
- `packageManager` declara la versión esperada del gestor para reducir diferencias entre entornos.
- `ignore-scripts=true` bloquea scripts arbitrarios de instalación por defecto.
- `allowBuilds` en `pnpm-workspace.yaml` autoriza explícitamente solo los builds requeridos de `@nestjs/core` y `esbuild`.
- `overrides` fija `multer` y `path-to-regexp` en versiones parcheadas para evitar vulnerabilidades transitivas conocidas del adaptador Express.

Estos controles reducen riesgos y mejoran la trazabilidad, pero pnpm no elimina todos los riesgos de supply chain. Una dependencia comprometida, un paquete malicioso aprobado o una vulnerabilidad transitoria siguen requiriendo revisión.

## Auditoría De Dependencias

Ejecuta la auditoría desde la raíz:

```bash
pnpm audit
pnpm audit --prod
```

Revisa cada vulnerabilidad según severidad, versión afectada, alcance y posibilidad real de explotación. No actualices dependencias automáticamente sin revisar el lockfile, los cambios de API y las pruebas.

Para revisar el inventario directo:

```bash
pnpm list --depth 0 -r
```

Cuando se agregue una dependencia nueva, debe ser necesaria para el alcance, fijarse en el manifest, actualizar el lockfile y pasar typecheck, tests y build.

## Scripts De Instalación

Los scripts de instalación están bloqueados por defecto mediante `.npmrc`. Si una dependencia futura requiere compilación nativa, no se debe habilitar globalmente sin revisión. Debe:

1. Identificarse el paquete y el script requerido.
2. Revisarse su origen, versión e integridad en el lockfile.
3. Autorizarse de forma explícita en `allowBuilds`.
4. Ejecutarse nuevamente con `pnpm install` y validar el resultado.

No se recomienda `--ignore-scripts=false` como configuración permanente ni aprobar todos los paquetes indiscriminadamente.

## Solución De Problemas

### Lockfile desactualizado

Si `pnpm install --frozen-lockfile` falla porque cambió un manifest, ejecuta `pnpm install` de forma intencional, revisa el diff de `pnpm-lock.yaml` y repite la validación congelada.

### Build bloqueado por un script

Revisa `pnpm-workspace.yaml` y `allowBuilds`. Añade únicamente el paquete justificado, nunca todos los paquetes por defecto.

### API no inicia

Confirma que `.env` existe, que `JWT_SECRET` tiene al menos 32 caracteres y que el puerto 3000 está libre.

### Frontend no conecta con el API

Confirma que el API está activo en `http://localhost:3000` y que `VITE_API_URL` usa ese origen. Reinicia Vite después de modificar variables de entorno.
