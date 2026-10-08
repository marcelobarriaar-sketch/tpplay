# TP PLAY · cuentas y acompañamiento de Valle del Coihue

Entrega local para revisión. **No publicada ni conectada a un proyecto Supabase real.** No se crearon cuentas reales ni se enviaron correos.

## Qué incorpora el código

- Bienvenida completa en el inicio y botón **Comenzar mi aventura** → `/aventura`.
- Cuando hay una sesión de estudiante válida: mapa de `/juegos/mision-tributos`. Sin sesión: Ingresar / Crear mi cuenta. Sin configuración: aviso de cuentas pendientes, sin formularios que simulen registros.
- Registro con nombre, correo, ciudad y establecimiento por ID estable, contraseña y confirmación. Si falta el establecimiento, se registra una solicitud pendiente. Se incluyen cinco ciudades iniciales de Los Lagos; el administrador puede ampliar el registro. Los nombres se normalizan al comparar para evitar duplicados por mayúsculas, acentos o espacios.
- Supabase Auth: verificación de correo, sesión, cierre y recuperación por enlaces. No se implementa criptografía propia para estudiantes. Las contraseñas no se guardan en las tablas del proyecto ni se exportan.
- Progreso de Misión tributos y evidencias en PostgreSQL: respuesta, intento, corrección calculada por servidor, apoyos, misión, juego, versión del contenido, conceptos, fecha y actividad finalizada. Justificaciones abiertas al completar cada misión.
- Códigos de curso generados por docente: válidos siete días y hasta cien incorporaciones. Solo su hash se conserva; el código aparece una vez al crearlo. Colegio/ciudad nunca conceden permisos.
- Panel `/acompanamiento`: cursos autorizados, filtros por establecimiento/curso/estudiante/juego, evidencias (páginas de 200 registros, con opción de cargar anteriores), conceptos por reforzar, sugerencias explicables y CSV. El único juego conectado al seguimiento escolar en esta entrega es Misión tributos.
- Rúbrica con seis criterios, cuatro niveles y **Sin evidencia suficiente** separado (valor nulo, sin cero). Descriptores y ponderaciones editables por nuevas versiones. El docente asigna niveles, justifica cada criterio, guarda borrador y confirma antes de publicar. No se genera nota 1,0–7,0.
- Perfil `/cuenta`: cursos, progreso y retroalimentación publicada propia. Los borradores no se entregan al estudiante.
- Administración `/administracion-cuentas`: correcciones, permisos, activación/desactivación, asignación/retiro de curso, estado de verificación de correo, recuperación y aprobación de establecimientos. Cambios de perfil, membresía, curso/docente y aprobación con auditoría en la misma transacción.
- Permisos en API y RLS. El registro público siempre crea estudiantes, aunque alguien manipule los metadatos. La API verifica la identidad con `auth.getUser(token)` y consulta el rol/estado vigente en `profiles`.

## 1. Crear y configurar Supabase

1. Crear un proyecto nuevo en [Supabase](https://supabase.com/dashboard). Usar primero un proyecto de pruebas con personas adultas o datos ficticios.
2. En SQL Editor ejecutar **una vez** `supabase/migrations/001_learning.sql` completo. Es una migración para una base nueva: no ejecutarla sobre tablas existentes sin revisar y respaldar. Incluye tablas, relaciones, funciones, RLS, restricciones y cinco ciudades iniciales.
3. En Authentication habilitar Email y **Confirm email**. Definir contraseña mínima de 12 caracteres y protección contra contraseñas filtradas si el plan la permite. Configurar un proveedor SMTP propio antes de probar con estudiantes: el servicio de correo inicial no sustituye un envío escolar operativo.
4. En URL Configuration fijar Site URL al origen que se probará. Agregar las direcciones exactas de retorno: `/cuenta` y `/cuenta/recuperar` en ese origen. Para desarrollo, agregar `http://127.0.0.1:5175/cuenta` y `http://127.0.0.1:5175/cuenta/recuperar`. Usar dominios de prueba autorizados; evitar comodines amplios.
5. Configurar duración limitada de los enlaces de correo/recuperación (por ejemplo, 30 minutos) y revisar los límites de envío de Supabase. Los enlaces de recuperación los controla el proveedor; no existe contraseña temporal compartida. Esta SPA usa el flujo de correo predeterminado de Supabase (`implicit`) para que los enlaces enviados por el servidor y el navegador sean compatibles, incluso al abrirlos en otro dispositivo. El SDK procesa y limpia los tokens del fragmento de retorno; no cambiar solo uno de los clientes a PKCE sin adaptar el flujo de correo completo.
6. Obtener la URL del proyecto, su **publishable key** pública y la **secret key** privada del servidor. No compartir la secret key por chat, no ponerla en Git y no usar prefijo `VITE_` para ella.

Documentación oficial: [React y Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-react), [contraseñas y recuperación](https://supabase.com/docs/guides/auth/passwords), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 2. Variables y ejecución local

Añadir a `.env.local` (archivo ignorado por Git; conservar las variables administrativas que ya existan):

```dotenv
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=CLAVE_PUBLICA
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SECRET_KEY=CLAVE_PRIVADA_SOLO_SERVIDOR
TPPLAY_APP_ORIGIN=http://127.0.0.1:5175
```

Los valores de ejemplo no son credenciales. Ambas URL deben referirse al mismo proyecto. La API responde 503 si faltan variables del servidor. Las variables VITE son públicas en la compilación; la clave privada nunca debe estar allí.

```sh
pnpm install --frozen-lockfile
pnpm dev --port 5175
```

Reiniciar Vite al modificar las variables. **`vite preview` sirve el build estático y no ejecuta las funciones**: probar cuentas con `pnpm dev` o un despliegue Vercel autorizado que incluya `/api/learning`.

Cuando se autorice publicar, configurar las cinco variables en el entorno de Vercel elegido y sustituir `TPPLAY_APP_ORIGIN` por su origen HTTPS exacto. Las variables VITE requieren reconstruir. No reutilizar credenciales de prueba en producción. Esta entrega no cambia Vercel ni publica GitHub automáticamente.

## 3. Primer administrador

1. Con Supabase ya configurado, abrir `/cuenta/crear`, registrar la cuenta del responsable y verificar el correo. Si falta su colegio, escribir el nombre para crear la solicitud.
2. En Supabase SQL Editor, comprobar el correo y copiar el UUID del usuario. El propietario del proyecto ejecuta:

```sql
-- Reemplazar únicamente el UUID por el usuario confirmado del responsable.
update public.profiles p
set role = 'admin', active = true
where p.id = 'UUID_DEL_RESPONSABLE'::uuid
  and exists (select 1 from auth.users u
              where u.id = p.id and u.email_confirmed_at is not null);
```

3. Cerrar y volver a iniciar sesión. Abrir `/administracion-cuentas` y aprobar el establecimiento pendiente o agregar el nombre oficial al registro.
4. Los docentes se registran/verifican primero como estudiantes. Un administrador autorizado cambia su permiso a Docente desde el panel. No existe registro público docente ni contraseña docente predeterminada. El administrador también puede corregir un curso, cambiar su docente asignado o cerrarlo a nuevas incorporaciones.

El engranaje anterior `/admin` conserva su acceso al inventario y **no concede permisos escolares**. La cuenta nueva del administrador debe usar Supabase; desde `/cuenta` se accede a la gestión de cuentas. Para cambiar el rol de un administrador, debe hacerlo otro administrador autorizado.

## 4. Crear un curso y comenzar

1. El docente ingresa y abre `/acompanamiento`.
2. Crea el curso indicando nombre y establecimiento; queda asignado a su cuenta.
3. Selecciona el curso y pulsa **Generar código de invitación**. Copia el código y entrégalo a sus estudiantes fuera del sitio. TP PLAY no envía mensajes a los alumnos automáticamente.
4. El estudiante crea/verifica su cuenta, ingresa y escribe el código en **Mis cursos** de `/cuenta`.
5. Pulsa **Continuar mi aventura**. El mapa abre la primera misión disponible. Responde a su ritmo; cada cambio confirmado se guarda en el servidor.
6. Al completar una misión, entrega una explicación breve sobre lo aprendido y un caso nuevo. Puede regresar a una misión completada para añadir una explicación.
7. El docente consulta evidencias, elige niveles, fundamenta cada criterio y guarda borrador o publica después de confirmar su revisión. El estudiante consulta únicamente la evaluación publicada desde `/cuenta`.

Las evaluaciones publicadas y su rúbrica son inmutables. Esta versión mantiene una evaluación por estudiante y curso; una segunda ronda de evaluación debe diseñarse como un nuevo registro antes de reutilizar el mismo curso para un nuevo período. No sobrescribir una publicación para “corregir” el historial.

## 5. Guardado y continuidad

- Misión tributos dejó de leer/escribir `localStorage` como fuente del progreso. La API aplica eventos admitidos y calcula intentos/resultados; no acepta estados completos ni resultados declarados por el navegador.
- Cada evento tiene UUID y revisión esperada. Reintentar el mismo UUID no duplica intentos. Si otro dispositivo avanzó, se solicita recargar el checkpoint antes de continuar.
- Una respuesta sin confirmar queda temporalmente en memoria con botón **Reintentar la misma respuesta**. No se da por guardada. Si se recarga antes de confirmar, debe volver a entregarse desde el checkpoint. No hay juego escolar sin conexión ni sincronización automática de evidencias locales antiguas.
- Reiniciar comienza otro recorrido, conservando evidencias anteriores para el docente. No se importa automáticamente el avance local anterior: sus resultados no fueron verificados por el servidor.
- No se usa velocidad, duración, XP ni número de clics para evaluar. No se recopila tiempo activo en esta entrega.

## 6. Validación realizada y pruebas pendientes

Validaciones locales: compilación TypeScript/Vite y HTML público, pruebas del juego, API con un adaptador aislado del proveedor, recorrido completo de las siete misiones mediante el reductor del servidor, y migración ejecutada en PostgreSQL embebido (PGlite) para verificar RLS, normalización de establecimientos, invitaciones, revisiones, idempotencia, auditoría y publicación inmutable. Se revisó en navegador la bienvenida, el botón, el acceso sin configuración y el diseño móvil.

**Estas pruebas no equivalen a un recorrido real en Supabase/Vercel.** Al no existir un proyecto conectado, siguen pendientes SMTP, enlaces reales de verificación/recuperación, dos dispositivos reales, y el recorrido completo:

- Registro → correo → ingreso → invitación → juego → evidencia → docente → rúbrica → publicación → consulta del estudiante.
- Dos alumnos distintos: intentar leer resultados ajenos y actualizar evidencias/roles mediante API y REST directo debe producir rechazo.
- Dos docentes con cursos distintos: probar que la API no permite consultar estudiantes del curso ajeno.
- Desactivar una cuenta con sesión abierta: la siguiente solicitud de datos escolares debe rechazarse.
- Dos pestañas/dispositivos: enviar respuestas concurrentes y comprobar conflicto de revisión sin duplicación.
- Recuperación: enlace válido, usado y vencido; cambios de contraseña y cierre de sesión.
- CSV con nombres/comentarios que empiezan con `=`, `+`, `-` o `@`: deben quedar como texto.

Antes del piloto escolar, el responsable debe definir plazo de conservación, procedimiento de eliminación, información a las familias y acuerdos del establecimiento. El aviso de privacidad explica el uso educativo y evita solicitar RUT, domicilio o fecha de nacimiento. No hay perfiles ni rankings individuales públicos.

Dependencias nuevas: `@supabase/supabase-js` para el proveedor mantenido; `@electric-sql/pglite` solo para pruebas; Prettier solo como herramienta de desarrollo. No se provisionó ningún servicio externo ni se contrataron planes.
