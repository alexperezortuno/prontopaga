# Uso de Inteligencia Artificial en el Desarrollo

## Herramientas utilizadas

- **AI Local:** apoyo en la definición de requisitos, planificación de tareas,
  arquitectura y elaboración de instrucciones técnicas, utilizando modelos desde HF e implementado con herramientas propias tales como [LARM](https://github.com/alexperezortuno/local-ai-runtime-manager).
- **GitHub Copilot:** asistente de programación de autocompletado de código y generación de pruebas unitarias.
- **OpenCode:** asistente de programación para implementar, revisar y documentar
  el código.

No se especifican modelos concretos porque no existe evidencia suficiente en el
repositorio para atribuirlos de forma fiable.

## Áreas apoyadas por IA

La asistencia se aplicó a las áreas que se encuentran implementadas en el
repositorio:

- **Backend NestJS:** organización hexagonal, autenticación JWT, autorización
  RBAC y endpoint de consulta de score determinista.
- **Frontend React:** formulario de autenticación, consulta de score, manejo
  centralizado de errores y formateo de RUT.
- **Seguridad:** sanitización de errores HTTP y configuración de hardening para
  Nginx.
- **Infraestructura:** Dockerfiles, Docker Compose y script de construcción para
  los ambientes definidos.
- **Pruebas:** apoyo en la definición y revisión de casos para backend y
  frontend, incluyendo autenticación, autorización, errores, score y RUT.
- **Documentación:** README, requisitos de configuración local, decisiones de
  seguridad y hardening de Nginx.

## Criterio técnico y responsabilidad

La IA se utilizó como herramienta de apoyo y no como sustituto del criterio
técnico. Las decisiones finales de stack, arquitectura y alcance corresponden
al desarrollo del repositorio y se reflejan en su estructura, documentación e
historial de cambios.

El código generado con asistencia de IA se incorporó al repositorio como parte
del proceso de desarrollo. Este documento no afirma ejecuciones de pruebas,
compilaciones o validaciones automatizadas que no estén respaldadas por una
evidencia específica de ejecución.
