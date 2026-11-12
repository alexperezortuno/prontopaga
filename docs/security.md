# Decisión De Seguridad

## Contexto

SEC-001 establece un contrato explícito para el manejo de errores entre el API
NestJS y la aplicación React. El objetivo es evitar que una respuesta HTTP revele
detalles internos y asegurar que el frontend no dependa de mensajes generados por
el backend.

Los mensajes de excepciones, errores de validación, nombres de clases, rutas de
archivos, trazas y detalles relacionados con autenticación pueden revelar
información útil para reconocimiento o facilitar la explotación de la aplicación.

## Decisión

El backend comunica el resultado de una operación fallida mediante el código HTTP
correspondiente. Las respuestas de error no incluyen body.

El frontend interpreta el código HTTP y selecciona un mensaje genérico para el
usuario. El contenido del body de una respuesta fallida no se procesa ni se utiliza
para construir mensajes visibles.

Los detalles técnicos permanecen exclusivamente en los registros internos
controlados del backend, con redacción de valores sensibles.

## Backend

### Exception Filter Global

`SanitizedExceptionFilter` se registra globalmente en `apps/api/src/main.ts`.

Su comportamiento es:

- Mantener el status de las instancias conocidas de `HttpException`.
- Convertir excepciones no controladas en HTTP `500`.
- Responder con `response.status(status).send()`, sin JSON ni body.
- No enviar mensajes, propiedades `error`, `details`, nombres de clases ni stack traces.
- Registrar internamente las excepciones inesperadas mediante el `Logger` de NestJS.
- Redactar valores asociados a autorización, contraseñas, tokens, secretos y JWT en los logs.

Esta decisión mantiene la semántica HTTP existente. Un error de validación sigue
siendo `400`, un fallo de autenticación sigue siendo `401`, una denegación sigue
siendo `403`, una ruta inexistente sigue siendo `404` y una excepción inesperada
se convierte en `500`.

### Validación Y Autorización

`ValidationPipe`, `JwtAuthGuard` y `RolesGuard` conservan sus reglas actuales.
El filtro evita que los mensajes que producen sean enviados al cliente, sin
modificar las decisiones de autorización ni el algoritmo de autenticación.

La respuesta no permite distinguir desde el cliente si un `401` se originó por
credenciales, formato, firma, algoritmo o expiración del token. Esa información no
es necesaria para el comportamiento del frontend y no debe exponerse.

## Frontend

La interpretación centralizada está en `apps/web/src/services/api.ts`.

`getErrorMessage(status)` contiene el único mapeo entre códigos HTTP y mensajes
visibles. El cliente HTTP:

- Evalúa `response.ok`.
- Usa `response.status` para clasificar errores.
- No ejecuta `response.json()` cuando la respuesta es fallida.
- Soporta respuestas fallidas sin body.
- Convierte errores de red sin respuesta HTTP en un error genérico.
- Mantiene intacto el procesamiento de respuestas exitosas.

Los componentes no inspeccionan mensajes del backend. `LoginForm` y
`ScoreConsultation` consumen los errores producidos por el servicio centralizado.

### Sesiones

- HTTP `401`: se muestra el mensaje genérico de autenticación y se limpia la sesión
  activa para permitir iniciar sesión nuevamente.
- HTTP `403`: se muestra el mensaje de permisos y la sesión permanece activa.

No se realizan redirecciones automáticas adicionales, evitando ciclos de
redirección.

## Alternativas Descartadas

### Devolver El JSON Original De NestJS

Se descartó porque puede contener mensajes de validación, nombres de errores,
detalles internos o información de implementación.

### Leer `response.json()` En Cada Componente

Se descartó porque duplica la lógica, depende del formato de error del backend y
no funciona de forma segura cuando la respuesta no tiene body.

### Usar Mensajes Del Backend Para La UI

Se descartó porque acopla la experiencia del usuario a detalles internos y puede
exponer información técnica o sensible.

### Incorporar Axios

Se descartó porque el proyecto ya utiliza Fetch API y no existe una necesidad
técnica que justifique añadir una dependencia.

## Verificación

La implementación se verifica mediante:

- Pruebas e2e de respuestas `400`, `401`, `403`, `404` y `500` con body vacío.
- Pruebas de ausencia de stack traces y detalles de validación en respuestas.
- Pruebas de preservación de respuestas exitosas y reglas de autorización.
- Pruebas del mapeo de códigos HTTP en el frontend.
- Pruebas de errores de red y respuestas de error sin body.
- Pruebas de limpieza de sesión para `401` y permanencia de sesión para `403`.
- Verificación HTTP real de respuestas de error sin body.

## Alcance Y Limitaciones

Esta decisión protege la superficie de respuestas HTTP y no sustituye otros
controles de seguridad. El backend sigue requiriendo configuración segura de
`JWT_SECRET`, y las credenciales mock del MVP continúan siendo únicamente para
demostración local.

Los logs internos deben permanecer protegidos y con acceso restringido. La
redacción implementada reduce la exposición accidental de secretos, pero no
elimina la necesidad de revisar nuevos datos que puedan añadirse al logging en el
futuro.
