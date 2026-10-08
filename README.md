# TP PLAY

**Aprende jugando. Construye tu futuro.**

Prototipo navegable de la Etapa 1 para Educación Media Técnico Profesional. Incluye tres especialidades, tres misiones de demostración, búsqueda y filtros, biblioteca de referencias, rutas, resultados y aprendizaje local. No hay cuentas reales, servidor de evaluaciones ni estudiantes conectados.

## Ejecutar

Requiere Node.js 22 o posterior. El repositorio incluye `pnpm-lock.yaml` para instalaciones reproducibles.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

También puedes usar `npm install` y `npm run dev`. Para compilar: `pnpm build`; para probar la compilación: `pnpm preview`; para las pruebas de progreso: `pnpm test`.

No requiere variables de entorno ni claves de servicios. Vite muestra la dirección de la vista local en la terminal.

## Probar el recorrido

1. Inicio → **Comenzar desafío**.
2. En el catálogo, busca o filtra por especialidad, módulo, nivel, dificultad y modalidad. Una búsqueda sin coincidencias permite quitar los filtros.
3. Abre la ficha de **Misión IVA**, **Rescate del invernadero** o **Tu primera entrevista** y lee su contexto, criterios y estado de revisión.
4. **Comenzar como invitado** → toma decisiones. Las pistas no penalizan; cada respuesta tiene retroalimentación. Misión IVA incluye un cálculo sobre datos ficticios.
5. Puedes **Guardar y salir**, recargar y continuar desde **Mi aprendizaje** en el mismo navegador.
6. Escribe una evidencia sin datos personales y pulsa **Terminar y ver resultados**.
7. Revisa criterios logrados y por mejorar. La evidencia escrita queda pendiente de revisión; no se evalúa automáticamente.
8. Abre **Mi aprendizaje** para consultar historial, evidencias, insignias, rutas y XP. Repite una misión para mejorar.

## Estado de la demo

- Tres misiones completas, versión `demo-1.0`, datos ficticios y niveles orientativos. Contenido pendiente de validación docente; no se declara alineación curricular ni respaldo oficial.
- Atención de Párvulos presenta sus espacios y la futura misión «Un espacio seguro para aprender» como **En preparación**. No tiene un botón para jugar contenido inexistente.
- Los módulos sin misiones muestran su estado y una biblioteca real de enlaces. Las rutas solo incluyen misiones disponibles.
- `localStorage` guarda respuestas, etapas, evidencia y preferencia de movimiento. Los errores de lectura y escritura muestran aviso y opción de reintento. La demo no sincroniza dispositivos ni garantiza historial permanente.
- 100 XP por primera finalización de cada misión. 50 adicionales una sola vez si un intento posterior mejora los criterios automáticos. Se calculan desde los intentos terminados, de forma idempotente. No se usan como nota ni certificación; la evidencia abierta no recibe XP de revisión automática.
- Solo hay un recorrido personal de demo por navegador. Las rutas de administración y cursos muestran acceso no disponible. No se simula seguridad mediante contraseñas, perfiles ficticios o roles en el cliente.
- El área docente es explicativa; no permite crear cursos ni consultar participantes reales.
- Sin analítica, audio automático, cronómetros, vidas, mensajería ni clasificación pública.
- Paisaje y portadas generados para TP PLAY a partir de la referencia visual aportada, componentes HTML reales, iconos Lucide (licencia ISC) y tipografía del sistema.

## Validación realizada

- TypeScript y compilación Vite.
- Pruebas automatizadas de puntuación, XP sin duplicados, mejora, recuperación de etapa y datos locales incompatibles.
- Navegador: recorrido completo de las tres misiones; respuesta incorrecta con retroalimentación; recuperación de un monto y etapa después de recargar; resultado sin XP duplicado; filtros y búsqueda sin coincidencias; menú y filtros móviles.
- Anchos revisados: 390, 768 y 1280 píxeles, sin desplazamiento horizontal en la portada. Consola sin errores en el recorrido revisado.

## Fuentes y revisión

Referencias consultadas el **7 de octubre de 2026**:

- [SII: Impuestos indirectos](https://www.sii.cl/aprenda_sobre_impuestos/impuestos/impuestos_indirectos.htm), para la tasa y conceptos del IVA. El caso ficticio excluye exenciones, ajustes, saldos previos y compras no admitidas; no constituye una declaración ni asesoría tributaria.
- [Currículum Nacional: Formación TP](https://www.curriculumnacional.cl/curriculum/3o-4o-medio-tecnico-profesional).
- [Biblioteca MINEDUC: Programa Administración](https://bibliotecadigital.mineduc.cl/handle/20.500.12365/316).

Consultar una fuente no valida una misión. El docente responsable, la revisión por especialidad y el vínculo exacto con aprendizajes oficiales aún deben establecerse para el piloto.

## Antes del piloto

1. Validar las misiones, nomenclatura, nivel y aprendizajes con docentes de cada área y programas vigentes; pilotear las duraciones.
2. Definir operación institucional o abierta, responsables, privacidad escolar y adecuaciones PIE.
3. Implementar autenticación real y autorización en servidor: estudiantes solo sus intentos; docentes solo sus cursos; roles administrados fuera del registro público.
4. Agregar base de datos con versiones de desafío, intentos, evidencias, cursos, membresías, asignaciones, revisión docente y eventos únicos de XP calculados en servidor.
5. Probar aislamiento de datos, guardado entre dispositivos y fallos. No usar la puntuación del navegador como autoridad.
6. Definir infraestructura y publicar en un dominio después de aprobar el destino. `vercel.json` prepara las rutas SPA, pero no conecta ni publica servicios.

La comunidad, colaboración, editor de misiones y reportes pertenecen a ampliaciones posteriores.

## Referencia visual de octubre de 2026

Portada inspirada en la imagen aportada por el usuario: campus lacustre realista, luces violeta, título lima y tarjetas fotográficas. Las cuatro ilustraciones fueron generadas para TP PLAY; son escenas ficticias, sin respaldo institucional. Los archivos WebP se sirven localmente, con variante de portada para pantallas pequeñas y carga diferida en las tarjetas. La interfaz y sus botones son HTML funcional. El progreso sigue calculándose desde los intentos del navegador.

La portada se ajustó a una interpretación de la Región de Los Lagos: lago Llanquihue, cono nevado del volcán Osorno, laderas boscosas y detalles de madera. El campus sigue siendo ficticio.
