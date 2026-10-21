# TP PLAY · Valle del Coihue

React 19 + TypeScript + Vite y React Router, CSS propio, Vercel Node Functions, Supabase Auth y PostgreSQL. Se conserva el contenido de las especialidades y las misiones existentes.

## Desarrollo local

Requiere Node.js 22 o posterior y pnpm. El lockfile es `pnpm-lock.yaml`.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
pnpm build
pnpm test
```

Completar `.env.local` privadamente. Vite ejecuta las API de `/api/admin`, `/api/modules` y `/api/learning`; `vite preview` sirve archivos estáticos, no las funciones.

### Variables

| Variable | Uso |
| --- | --- |
| VITE_SUPABASE_URL | URL pública del proyecto de autenticación |
| VITE_SUPABASE_PUBLISHABLE_KEY | Clave publicable, protegida por RLS; no usar secret/service role |
| SUPABASE_URL | Mismo proyecto, solo servidor |
| SUPABASE_SECRET_KEY | Clave privada del servidor; nunca prefijo VITE |
| TPPLAY_APP_ORIGIN | Origen exacto, https://www.tpplay.cl en producción; origen propio en Preview/local |
| ADMIN_USER / ADMIN_PASSWORD_HASH / ADMIN_SESSION_SECRET | Mantenimiento editorial histórico aislado |
| DATABASE_URL | Conexión PostgreSQL privada para herramientas operativas; no necesaria en frontend |

No publicar valores ni credenciales. `.env*` privados y `work/` están excluidos de Git. No copiar la base de datos de estudiantes al entorno de pruebas.

### Base de datos y migraciones

Usar un proyecto Supabase de desarrollo separado de producción. Supabase proporciona el esquema `auth`, hashing y sesiones. Aplicar los archivos SQL de `supabase/migrations` en orden. Son transaccionales, versionados y no deben ejecutarse dos veces.

```sh
TPPLAY_APPLY_MIGRATIONS=true node --env-file=.env.local scripts/migrate-identity.mjs
```

El runner usa `DATABASE_URL`, bloqueo de migraciones y ledger `tpplay_migrations`. En una instalación existente se detiene si no hay baseline: primero comprobar tablas/funciones y registrar **solo** las migraciones realmente aplicadas en ese ledger. No se infiere el estado ni se ejecutan scripts destructivos para reparar diferencias. Las migraciones 005–008 conservan datos anteriores; 006 agrega identidad y progreso, 007 operaciones/proyección y 008 comprueba revocación de sesiones de Supabase. Las pruebas aplican DDL a PostgreSQL embebido (PGlite).

### Autenticación y correo

Configurar Supabase Auth: email+password, contraseña mínima 12, confirmación de correo, Site URL y allowlist exacta de redirecciones `/cuenta` y `/cuenta/recuperar` del entorno. Configurar SMTP de un dominio verificado para producción y sus límites; el correo de prueba predeterminado del proveedor no debe presentarse como correo de producción. El SDK mantiene/renueva sesión; el servidor valida `getUser`, sesión activa de `auth.sessions`, correo verificado y perfil activo en cada petición. La recuperación verifica un enlace de un solo uso del proveedor y luego actualiza contraseña/cierra sesión. El usuario puede solicitar otro enlace si venció. Nunca se guardan contraseñas en tablas de aplicación.

Registro público: nombre, apellido, correo, contraseña/confirmación, Estudiante o Docente, aceptación de términos y privacidad. No requiere RUT, domicilio, teléfono ni fecha de nacimiento. El trigger de PostgreSQL limita roles iniciales; `user_metadata.role=admin` no concede permisos. Los roles administrativos solo se asignan por operación protegida.

Primer administrador, desde un operador con conexión privada, después de registrar y verificar el correo del responsable:

```sh
TPPLAY_BOOTSTRAP_ADMIN=true node --env-file=.env.local scripts/bootstrap-identity-admin.mjs correo-del-responsable
```

El script se bloquea si ya hay un administrador activo y registra auditoría. Las promociones posteriores requieren administrador TP PLAY, contraseña actual y registro transaccional. Nadie cambia su propia cuenta por esa vía. Se preserva el acceso editorial anterior en `/admin/mantenimiento`: su cookie no concede permisos sobre datos académicos y conserva la recuperación/contacto independiente de estudiantes.

## Arquitectura y permisos

- Supabase Auth administra identidad, hashing, verificación, refresh y recuperación; perfiles/roles/estado viven en PostgreSQL.
- Roles: `student`, `teacher`, `institution_admin`, `admin`. Los dos últimos no están en registro público.
- La API ignora identidades declaradas por el cliente y usa el UUID del token validado. RLS permite solo lecturas propias activas; las escrituras y RPC de progreso son exclusivas de `service_role`.
- Estado `active`, `pending`, `suspended`. Suspender actualiza `active` mediante trigger y bloquea las siguientes solicitudes, incluso con una sesión abierta.
- `/admin` lista/busca/filtra/pagina usuarios, muestra fechas/estado y abre ficha; cambios sensibles requieren reautenticación y auditoría. No puede suspenderse o degradarse el último administrador.
- Dashboard institucional solo consulta el establecimiento asignado. Las funciones futuras están señaladas como próximas. No existe escalamiento de privilegios desde ese panel.
- Los cursos, membresías, invitaciones, evidencias y revisión docente anteriores se conservan y siguen autorizados por curso/docente. La matrícula no concede un rol docente.
- Cabecera reacciona a sesión. Cambiar de cuenta/rol desmonta los datos en memoria; nunca se presenta el caché de un estudiante al siguiente.

## Progreso y XP

Tres misiones estándar: `mission_attempts` conserva respuestas, confirmaciones, etapa, evidencia, fechas, versión, revisión y score. `mission_progress` proyecta estado, porcentaje, intentos y XP. Cada petición manda un evento y revisión esperada; el servidor aplica el reductor, determina puntuación y fecha de finalización y confirma la transacción. El mismo UUID de evento no duplica el intento. Otro dispositivo que avanzó produce conflicto visible, con recarga del checkpoint.

Valle del Coihue conserva `game_progress`, `evidence` y su reductor de siete misiones; `commit_game` agrega proyecciones y XP. No se recibe una puntuación del navegador. `xp_events` impone unicidad por usuario/misión/regla: 100 por primera finalización y, en misiones estándar, 50 una sola vez por mejorar respecto del primer intento. Logros funcionales: primera misión, 100 XP y tres misiones. El texto de evidencia no recibe una calificación automática.

Alumnos ven nivel (cada 200 XP), XP, porcentaje, misiones iniciadas/completadas, historial y logros. Los resultados muestran decisiones, retroalimentación, evidencia y fecha. Guardar/salir y comprobar decisiones esperan confirmación de servidor. Un error conserva el texto en memoria y permite reintentar el mismo evento. Los campos aún sin enviar se identifican como pendientes; no hay promesa de guardado sin conexión.

### Migración local

No se elimina `tpplay-demo-v1` ni `tpplay.coihue.tributos.v1`. `/alumno` ofrece importación explícita de datos propios. El servidor reconstruye transiciones, valida versiones/respuestas y recalcula XP; no acepta puntos ni correctitud declarados por el navegador. Los IDs derivados por propietario y `local_imports` evitan duplicados. No se sobrescribe una aventura cloud existente ni otro borrador activo.

Las fechas históricas, historial de errores y número exacto de intentos locales no pueden verificarse: se conserva el original y se marca el registro como importado, sin presentarlo como evidencia docente validada. La importación de Coihue reconstruye el checkpoint y ayudas; no inventa eventos pasados. El modo invitado continúa siendo una demostración local separada; las cuentas usan base de datos como autoridad.

## Rutas

- `/cuenta/crear`, `/registro`: registro público estudiante/docente.
- `/cuenta/ingresar`, `/ingresar`: acceso.
- `/cuenta/recuperar`: solicitud/enlace seguro de recuperación.
- `/perfil`: identidad, datos editables, contraseña segura y estadísticas personales.
- `/alumno`, `/mi-aprendizaje` con sesión: dashboard de estudiante.
- `/docente`, `/acompanamiento`: herramientas docentes protegidas.
- `/institucion`: dashboard institucional protegido.
- `/admin`: gestión de usuarios TP PLAY.
- `/admin/contenidos`, `/admin/mantenimiento`: contenido editorial y mantenimiento existente.
- `/administracion-cuentas`: herramientas previas de cursos/establecimientos, solo admin.
- `/cuenta/cursos`: cursos y establecimiento propios.
- `/desafios/:slug/jugar`, `/intentos/:id/resultados`: misiones/resultados propios en cuenta; demo separada para invitado.
- `/preferencias`: preferencias de interfaz, no datos académicos.

Se conserva Inicio, Especialidades, Administración (especialidad), Desafíos, Misión IVA, Recursos y Cómo funciona. Las rutas privadas usan HTML noindex y quedan fuera del sitemap; `/docente` dejó de ser una página explicativa pública.

## Pruebas y cuentas de desarrollo

```sh
pnpm build
pnpm test
TPPLAY_ALLOW_TEST_SEED=true node --env-file=.env.local scripts/seed-identity.mjs
```

El seed solo funciona en un proyecto separado, se bloquea contra el proyecto de producción y con `VERCEL_ENV=production`, genera los cuatro roles y contraseñas aleatorias en un archivo privado `work/identity-test-accounts.local.json`. No añade credenciales al código.

Pruebas de dominio/API/SQL: permisos por rol, datos propios, escalamiento, falsificación de XP, saltos de etapas, duplicados, persistencia entre sesiones simuladas, RLS, suspensión, auditoría, publicación inmutable y migraciones. Las pruebas con adaptador de proveedor no sustituyen la comprobación real de registro, verificación, correo y recuperación. La evidencia de Preview/Producción y bloqueos reales se documenta por separado; no se da por desplegado un cambio que solo pasó pruebas locales.

## Deployment y rollback

1. Revisar las migraciones y baseline del entorno real; respaldo administrado de la base y snapshot previo del esquema.
2. Probar en Supabase de desarrollo aislado, aplicar migraciones aditivas y configurar SMTP/redirecciones.
3. Configurar variables **por entorno** en Vercel. Preview requiere su base y origen propios; no apuntarlo a estudiantes reales para pruebas.
4. `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm test`.
5. Desplegar Preview, verificar flujos de estudiante/docente/admin y móvil, y luego publicar/promover el mismo código comprobado.
6. Verificar dominio oficial, API, base y correo. Mantener deployment anterior para rollback; las tablas añadidas no se eliminan durante un rollback. No borrar respuestas, cuentas ni eventos para reparar despliegues.

## Próxima etapa

`schools` representa Institution, perfiles por rol Teacher/Student, `courses` y `memberships` representan cursos/matrícula. Se agregan `assignments`, `submissions`, `feedback` y `subscriptions` con referencias e índices; acceso futuro denegado por defecto hasta implementar sus políticas/endpoints. La siguiente etapa puede añadir códigos/asignaciones, fechas, entregas y retroalimentación al panel docente sin rehacer autenticación ni progreso.

Las misiones contienen casos ficticios con fuentes SII/MINEDUC; el sistema no afirma certificación, respaldo oficial ni una nota escolar a partir de XP. Ver `docs/identity-architecture.md` para inspección y decisiones. La documentación previa de Coihue se conserva como registro histórico; este documento describe la evolución del núcleo de identidad.
