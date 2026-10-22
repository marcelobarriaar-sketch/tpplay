# Núcleo de identidad: inspección y decisiones

Stack existente: React 19 + TypeScript + Vite, BrowserRouter, CSS propio, Vercel Node Functions y Supabase JS. No se cambia el framework. Rutas públicas prerenderizadas desde src/seo.ts, API /api/learning y administrador editorial histórico /api/admin. PostgreSQL/Supabase Auth ya configurado en producción; credenciales del servidor nunca usan prefijo VITE.

Persistencia inicial: `tpplay-demo-v1` contiene intentos de tres misiones (src/progress.ts); `tpplay.coihue.tributos.v1` contiene el recorrido local antiguo. Coihue usa ahora eventos validados en server/learningDomain.ts y commit_game con revisión optimista y evidencia idempotente. El proveedor de cuentas se montaba solo dentro de AccountArea: se lleva a la raíz para navegación y protección uniformes.

Decisión: conservar Supabase Auth (password hashing, renovación, correo y recuperación de un solo uso), PostgreSQL RLS y API que valida getUser y perfil/estado por petición. Roles internos student/teacher/institution_admin/admin. Roles públicos limitados a student/teacher; bootstrap de privilegios fuera del registro y operación privilegiada con reautenticación. Perfil separado en nombre/apellido; metadatos públicos nunca conceden administración. Estado active/pending/suspended. El administrador editorial histórico se mantiene como acceso de mantenimiento aislado y no concede acceso a cuentas académicas.

Las tres misiones estándar usan reducer del servidor, revisión optimista, ID de evento y transacción; no se aceptan XP, notas ni userId del cliente. El XP se registra en un ledger único por misión/regla. Coihue conserva sus eventos y agrega proyección por misión. Logros se asignan por condiciones comprobadas en servidor. Versiones y entradas locales se importan explícitamente, sin borrar origen; resultados locales se recalculan y se identifica procedencia (no constituyen evaluación docente certificada).

Las entidades existentes schools/courses/memberships/evaluations son reutilizadas. Se agregan relaciones para asignaciones, entregas, retroalimentación y suscripciones; no se publican datos de cursos ajenos ni funciones futuras sin implementar.
