# Hardening Nginx

## Alcance

QA y Production sirven la SPA mediante Nginx y proxyfican `/api/*` al servicio
NestJS `api:3000`. Development mantiene Vite sin CSP de producción para no
romper HMR; su proxy `/api` sigue funcionando en la red Compose.

La configuración se divide en:

- `docker/nginx/nginx.conf`: proceso, logging, timeouts y carga de archivos.
- `docker/nginx/security/rate-limit.conf`: zonas de solicitudes y conexiones.
- `docker/nginx/security/timeouts.conf`: límites de body, inactividad y estados.
- `docker/nginx/security/headers.conf`: cabeceras del frontend.
- `docker/nginx/security/restrictions.conf`: archivos privados y directory listing.
- `docker/nginx/security/proxy.conf`: headers mínimos del upstream.
- `docker/nginx/default.conf`: rutas, métodos, proxy y errores.

## Límites

| Control | Valor | Aplicación |
| --- | --- | --- |
| API general | `10r/s`, burst `20`, `nodelay` | `/api/` |
| Login | `5r/m`, burst `3`, `nodelay` | `POST /api/login` |
| Conexiones | `20` activas por IP | API |
| Request body | `1m` | Nginx completo |
| Headers del cliente | `10s` | Nginx completo |
| Body del cliente | `10s` | Nginx completo |
| Conexión upstream | `5s` | API |
| Lectura/escritura upstream | `30s` | API |
| Envío al cliente | `30s` | Nginx completo |
| Keep-alive | `15s` | Nginx |

Los estados `429` se generan cuando se exceden rate limits o conexiones. El
burst no es una ventana fija: permite una ráfaga limitada y el rate se evalúa
continuamente. La clave inicial es `$binary_remote_addr`, por lo que clientes
detrás de NAT comparten presupuesto. Esto no sustituye límites por usuario,
cuenta, credencial o controles de negocio.

`client_max_body_size 1m` solo limita el body HTTP y produce `413`; no valida
archivos ni agrega capacidades de upload.

## Rutas y métodos

- `/api/login`: acepta `POST` y `OPTIONS`; tiene una zona de rate limit propia.
- `/api/*`: acepta `GET`, `HEAD` y `OPTIONS`; aplica el límite general.
- `/`: acepta `GET` y `HEAD`; sirve artefactos o el fallback SPA.
- `PUT`, `PATCH`, `DELETE`, `TRACE` y `CONNECT` no son aceptados por las rutas.

Las respuestas de errores generadas por Nginx para `400`, `401`, `403`, `404`,
`405`, `413`, `429`, `502`, `503` y `504` son bodyless. Las respuestas del API
continúan usando `SanitizedExceptionFilter` de SEC-001, que conserva el status
y no devuelve detalles internos.

## Cabeceras

Se aplican con `always`:

- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` restrictiva para cámara, micrófono, geolocalización,
  pagos y USB.
- CSP con `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`,
  `connect-src 'self'`, `script-src 'self'`, `style-src 'self'`, imágenes
  propias/data y fuentes propias.

El build actual de Vite usa scripts y CSS externos, no necesita `unsafe-eval` ni
`unsafe-inline`, y consume el API mediante `/api` same-origin. No se agrega HSTS
porque estos ambientes exponen HTTP local; debe configurarse en el punto de
entrada TLS real cuando exista HTTPS.

## Archivos y servidor

`server_tokens off` evita la versión de Nginx. `autoindex off` desactiva
directory listing. Dot-files, `.env`, `.git`, backups, logs, configuraciones,
temporales y source maps son rechazados con `404` sin revelar existencia.
El build final solo copia `dist` y la configuración Nginx.

El access log registra IP directa, método, URI sin query string, status, bytes,
duración, referer y user-agent. No registra headers `Authorization`, bodies,
contraseñas ni JWT. Los rechazos `429` quedan identificables por status en los
logs y por nivel `notice` en error log.

Nginx recibe directamente las conexiones en Compose. No se configura
`set_real_ip_from`, `real_ip_header` ni confianza global en
`X-Forwarded-For`/`X-Real-IP`/`Forwarded`; esas cabeceras no pueden hacer spoof de
la IP usada para rate limiting. Si se coloca un proxy anterior, se debe definir
una lista explícita de redes confiables antes de activar real IP.

## Validación

```bash
export JWT_SECRET="un-secreto-de-al-menos-32-caracteres"
docker compose -f docker/compose.qa.yml config
docker compose -f docker/compose.prod.yml config
docker compose -f docker/compose.qa.yml up -d --build
docker compose -f docker/compose.qa.yml exec web nginx -t
docker compose -f docker/compose.qa.yml logs web
```

Repite con `compose.prod.yml`. Para inspeccionar solo logs:

```bash
docker compose -f docker/compose.prod.yml logs -f web
```

Las pruebas de rate limiting deben ser pequeñas y controladas. No representan
una prueba de carga ni sustituyen un WAF, protección distribuida o política de
cuentas.

## Referencias

- OWASP, HTTP Security Response Headers:
  <https://owasp.org/www-project-secure-headers/>
- OWASP, API Security Top 10:
  <https://owasp.org/API-Security/editions/2023/en/0x11-t10/>
- Nginx `limit_req`:
  <https://nginx.org/en/docs/http/ngx_http_limit_req_module.html>
- Nginx `limit_conn`:
  <https://nginx.org/en/docs/http/ngx_http_limit_conn_module.html>
- Nginx `ngx_http_headers_module`:
  <https://nginx.org/en/docs/http/ngx_http_headers_module.html>
- Nginx `ngx_http_proxy_module`:
  <https://nginx.org/en/docs/http/ngx_http_proxy_module.html>
