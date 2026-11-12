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

Las respuestas de error no incluyen body. El frontend interpreta exclusivamente el
código HTTP y muestra mensajes genéricos; los detalles técnicos se mantienen solo
en los registros internos controlados del backend.

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

## Docker

La configuración Docker separa los ambientes Development, QA y Production.
Las imágenes usan Node.js `22.23.2`, pnpm `11.8.0` y el lockfile congelado.
No se copian `.env` ni secretos a las imágenes.

### Variables

Backend:

- `JWT_SECRET`: obligatoria, sin valor por defecto y con al menos 32 caracteres.
- `PORT`: puerto interno del API, normalmente `3000`.
- `NODE_ENV`: `development`, `qa` o `production`.

Frontend y Vite:

- `VITE_API_URL`: URL consumida por el navegador. En Docker se usa `/api`.
- `VITE_DEV_API_TARGET`: destino interno del proxy Vite en development,
  normalmente `http://api:3000`.

Compose:

- `API_PORT`: puerto del API publicado solo en development. Por defecto: `3000`.
- `WEB_PORT`: puerto publicado por el frontend. Por defecto: `5173` en
  development y `8080` en QA/Production.

Antes de levantar QA o Production exporta un secreto real fuera del repositorio:

```bash
export JWT_SECRET="un-secreto-de-al-menos-32-caracteres"
```

No uses el valor de `.env.example` en QA o Production. El `.env` local queda
excluido del contexto Docker.

### Development

Construye ambas imágenes:

```bash
./scripts/build-dev.sh
```

También puedes construir una sola:

```bash
./scripts/build-dev.sh api
./scripts/build-dev.sh web
```

Levanta, inspecciona logs y detén el ambiente:

```bash
docker compose -f docker/compose.dev.yml up -d
docker compose -f docker/compose.dev.yml logs -f
docker compose -f docker/compose.dev.yml down
```

Development publica el API en `http://localhost:3000` y Vite en
`http://localhost:5173`. El código se monta desde el repositorio y los
`node_modules` permanecen en volúmenes Docker; Nest usa watch y Vite usa HMR.
El navegador llama `/api`, y Vite lo reenvía al servicio `api` sin cambiar los
endpoints públicos `/login` y `/score/:rut`.

### QA

```bash
docker compose -f docker/compose.qa.yml up -d --build
```

QA no monta el código, compila Nest y React, ejecuta Nest sin watch y sirve la
SPA con Nginx no privilegiado en `http://localhost:8080`. El API solo es
accesible dentro de la red Compose mediante el proxy Nginx.

### Production

```bash
docker compose -f docker/compose.prod.yml up -d --build
```

Production usa imágenes multi-stage, dependencias runtime mínimas para el API,
Nginx no privilegiado para la SPA y no publica directamente el API. El frontend
queda disponible en `http://localhost:8080` y `/api` se proxifica internamente
a `api:3000`. Cambia `WEB_PORT` si el puerto del host está ocupado.

### Construcción y solución de problemas

- Validar: `docker compose -f docker/compose.dev.yml config`,
  `docker compose -f docker/compose.qa.yml config` y
  `docker compose -f docker/compose.prod.yml config`.
- Si falta `JWT_SECRET`, Compose rechazará el arranque antes de crear contenedores.
- Si un puerto está ocupado, define `API_PORT` o `WEB_PORT` sin cambiar el
  puerto interno de los servicios.
- Si cambian dependencias, reconstruye con `--build`; BuildKit cachea el store
  pnpm sin copiar `node_modules` del host.
- Los usuarios y el score son memoria del proceso y no se persisten en volúmenes.

## Hardening Nginx

QA y Production incluyen hardening Nginx basado en OWASP, sin agregar otro
reverse proxy. Development mantiene Vite y HMR sin CSP de producción.

- API general: `10 requests/segundo` por IP, burst `20`.
- Login: `5 requests/minuto` por IP, burst `3`.
- Conexiones API: `20` activas por IP.
- Body máximo: `1 MB`, exceso responde `413`.
- Timeouts: headers/body `10s`, conexión upstream `5s`, upstream y envío `30s`.
- Métodos: GET/HEAD para SPA y consultas, POST/OPTIONS solo donde corresponde.
- Dot-files, `.git`, `.env`, backups, temporales y source maps responden `404`.
- Cabeceras: `nosniff`, `DENY`, Referrer Policy, Permissions Policy y CSP sin
  `unsafe-eval`/`unsafe-inline`.
- Nginx oculta su versión y registra URI sin query string, status y duración;
  no registra JWT, Authorization, credenciales ni cuerpos.

Los errores Nginx `413`, `429`, `502`, `503` y `504` son respuestas genéricas
sin body. Los errores Nest siguen siendo bodyless mediante SEC-001. La
limitación por IP no reemplaza controles por usuario o cuenta; clientes detrás
de NAT comparten presupuesto. No se confían headers de IP reenviada porque
Compose recibe conexiones directamente. La documentación completa está en
[docs/security-nginx.md](docs/security-nginx.md).

Validación rápida:

```bash
docker compose -f docker/compose.qa.yml config
docker compose -f docker/compose.qa.yml up -d --build
docker compose -f docker/compose.qa.yml exec web nginx -t
docker compose -f docker/compose.qa.yml logs -f web
```

## Política de seguridad

La justificación de las decisiones de sanitización de errores HTTP y manejo
centralizado en el frontend está documentada en [docs/security.md](docs/security.md).

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
