# ProntoPaga Financial Risk Score MVP

MVP de prueba técnica para autenticación JWT, autorización por roles y consulta de un score financiero determinista por RUT.

El score es una simulación técnica: no representa una evaluación crediticia real.

## Stack

- Backend: Node.js 22 LTS, NestJS, TypeScript strict, JWT, class-validator, Jest y Supertest.
- Frontend: React, Vite, TypeScript strict, Fetch API, Vitest y Testing Library.
- Workspace: pnpm 11.8.0 con `pnpm-lock.yaml`.
- Persistencia: ninguna. Los usuarios y datos son mock en memoria.

## Arquitectura

El backend sigue una arquitectura hexagonal:

- `domain`: reglas puras para RUT, score, roles y errores de dominio.
- `application`: casos de uso `LoginUseCase` y `GetScoreUseCase`, junto con sus puertos.
- `infrastructure`: controladores NestJS, DTOs, guards JWT, adaptador JWT y repositorio mock.

El frontend mantiene el JWT únicamente en memoria. Una recarga de la página requiere iniciar sesión nuevamente.

## Estructura

```text
apps/
  api/
    src/modules/auth/{domain,application,infrastructure}
    src/modules/score/{domain,application,infrastructure}
    src/shared/domain
  web/
    src/components
    src/hooks
    src/pages
    src/services
    src/types
docs/requirements.md
```

## Requisitos

- Node.js 22 LTS o superior compatible con el `engines` del proyecto.
- Corepack habilitado.
- pnpm 11.8.0.

La instalación detallada y las razones de seguridad de pnpm están en [docs/requirements.md](docs/requirements.md).

## Instalación

```bash
corepack enable
corepack prepare pnpm@11.8.0 --activate
pnpm --version
pnpm install --frozen-lockfile
cp .env.example .env
```

Edita `.env` y reemplaza `JWT_SECRET` por un valor local de al menos 32 caracteres. No uses el valor de ejemplo en un entorno real.

## Desarrollo

Desde la raíz del repositorio, el siguiente comando inicia ambos servicios:

```bash
pnpm dev
```

Alternativamente, usa dos terminales:

```bash
pnpm dev:api
pnpm dev:web
```

URLs locales:

- API: `http://localhost:3000`
- Web: `http://localhost:5173`

El backend carga el `.env` raíz mediante Node `--env-file`. Vite también lee el `.env` raíz, pero solo expone variables con prefijo `VITE_` al navegador.

## Credenciales mock

Estas credenciales existen únicamente para demostración local y no son secretos de producción:

| Usuario | Contraseña | Rol | RUT |
| --- | --- | --- | --- |
| `admin` | `admin123` | `admin` | No aplica |
| `user` | `user123` | `user` | `12.345.678-5` |

## API

### Login

```bash
curl -i http://localhost:3000/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}'
```

La respuesta incluye `accessToken` y los datos públicos del usuario. El JWT contiene `sub`, `role`, `iat` y `exp`; solo los usuarios `user` incluyen `rut`.

### Consultar score

```bash
TOKEN='pega-aqui-el-accessToken'
curl -i http://localhost:3000/score/12.345.678-5 \
  -H "Authorization: Bearer ${TOKEN}"
```

Un `admin` puede consultar cualquier RUT válido. Un `user` solo puede consultar `12.345.678-5`, incluso usando la forma equivalente `12345678-5`.

Respuestas esperadas:

- `200`: score y fecha ISO 8601 UTC.
- `400`: body de login o RUT inválido.
- `401`: credenciales, token, firma, algoritmo o expiración inválidos.
- `403`: usuario intentando consultar otro RUT.

## Pruebas, lint y build

Desde la raíz:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Pruebas específicas:

```bash
pnpm --filter @financial-risk/api test
pnpm --filter @financial-risk/web test
```

## Política de seguridad

- No se guardan credenciales ni JWT en el repositorio.
- El JWT se guarda solo en memoria en la SPA; no se usa `localStorage`.
- El secreto JWT se obtiene de `JWT_SECRET`, se exige al iniciar el API y debe tener al menos 32 caracteres.
- La firma esperada es HS256 y se verifica también la expiración.
- El backend no confía en el rol o RUT enviados por el frontend.
- `.env` está excluido por `.gitignore`; solo se versiona `.env.example`.
- pnpm usa lockfile congelable y scripts de instalación restringidos. Estos controles reducen superficie de riesgo, pero no eliminan todos los riesgos de supply chain.

## Limitaciones conocidas

- Usuarios, credenciales y score no se persisten.
- No existe registro de usuarios, refresh token, base de datos ni integración externa.
- Las credenciales mock están en código para facilitar la prueba técnica y no deben reutilizarse.
- El score determinista tiene 101 resultados posibles y no es una métrica financiera real.
- El frontend pierde la sesión al recargar la página por diseño de seguridad del MVP.
- No se incluye Docker ni despliegue productivo.
