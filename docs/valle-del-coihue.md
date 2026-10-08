# Valle del Coihue: misión tributos

Versión local de revisión. No desplegar ni subir esta rama a un repositorio que dispare despliegues sin una instrucción posterior de publicación.

## Abrir y editar

`pnpm dev` → `/juegos/mision-tributos`. Integrado en Desafíos, Administración y su módulo Gestión comercial y tributaria. El escenario tiene ocho lugares, siete misiones con relato y un Centro de Oficios que abre el pasaporte.

- `src/games/coihue/world.ts`: lugares con IDs estables, coordenadas del mapa, personajes y avatares. Otros juegos pueden reutilizarlos.
- `content.ts`: lecciones, conceptos, fuentes, personajes de cada misión, insignias y desafíos. Cada ítem declara ID, concepto, respuesta correcta, alternativas y explicaciones. Los textos son originales: las fuentes se usan como referencia conceptual.
- `progress.ts`: reglas puras de avance, evidencia, recuperación y almacenamiento.
- `Game.tsx`, `Map.tsx`, `ChallengeBoard.tsx`, `game.css`: interfaz y paisaje SVG propio, sin logos oficiales.
- `Card.tsx`: acceso desde el catálogo y el módulo.

Para cambiar el contenido evaluado, incrementa `contentVersion`. Para añadir un tipo de actividad, amplía el tipo Challenge y su representación en ChallengeBoard. Para un juego nuevo, reutiliza world y Map con otra colección de misiones, ruta y clave de almacenamiento. El mapa recibe estado y selección como propiedades y no conoce los tributos.

## Aprendizaje y progreso

El jugador lee la explicación antes de cada investigación. Cada misión tiene un caso inicial y otro contexto de transferencia. Pistas, glosario y pasaporte durante una comprobación registran apoyo; un error seguido de acierto conserva la marca de apoyo. Después de ayuda o de avanzar con errores, se ofrece una investigación adicional con casos diferentes para los conceptos involucrados. Los errores no bloquean la historia.

Se cuenta como máximo una evidencia por concepto y por investigación. Dos investigaciones correctas en casos distintos sin pistas/reintentos permiten **Comprendido**. Dos correctas con apoyo en alguna permiten **Comprendido con apoyo**. Si no hay suficiente evidencia, queda **Por reforzar**, aunque la misión esté completa. Las insignias reconocen avance y no reemplazan esta evidencia ni generan una nota escolar. Los casos adicionales son un banco finito; el pasaporte y glosario permiten revisar conceptos. Un nuevo recorrido requiere el reinicio confirmado de la aventura, sin afectar los otros juegos.

Clave local: `tpplay.coihue.tributos.v1`; datos versionados, sin backend, cuentas ni IA. Se guardan símbolo, apodo opcional, respuestas comprobadas, apoyo y capítulos avanzados. Las selecciones todavía no comprobadas pueden requerir elegirse nuevamente al recargar. Datos inválidos se recuperan como aventura nueva con aviso; almacenamiento bloqueado muestra una alerta y permite seguir durante la sesión. El avance no se sincroniza entre dispositivos.

## Revisión de contenido — 8 de octubre de 2026

Se contrastaron conceptos y funciones con SII Educa, competencias del SII, información de contribuciones y F29 del SII, centro de ayuda de TGR, leyes en BCN y el recurso curricular de Gestión comercial y tributaria del MINEDUC. Las fuentes y la fecha aparecen dentro del juego.

- Impuesto, tasa y contribución especial se presentan como distinciones doctrinales generales; no como categorías legales universales equivalentes. Derecho habilitante se usa descriptivamente. No se clasifica automáticamente la patente municipal.
- “Tasa” como porcentaje se diferencia de “tasa” como categoría general.
- Contribuciones de bienes raíces: Impuesto Territorial, con exenciones. No se enseñan como contribución especial.
- No se atribuye al SII toda la recaudación ni a TGR la fijación de impuestos.
- Se omiten tasas numéricas, fechas de vencimiento, multas concretas y requisitos particulares. El simulador no asesora sobre obligaciones reales.
- Canales: SII para declarar impuestos mensuales según modalidades habilitadas; SII/TGR para información de contribuciones y TGR para opciones oficiales de pago; municipalidad correspondiente para patentes y derechos. Las pantallas son ficticias, sin claves ni pagos.
- Las búsquedas oficiales confirmaron la referencia doctrinal de BCN y curricular de MINEDUC; algunos accesos directos a sus PDF/portal fallaron por caché o tiempo de espera. No se reprodujeron materiales ni detalles operativos no comprobados. Se usaron conceptos estables y se enlazaron las fuentes.

Requiere pilotaje docente para calibrar la duración orientativa de 25–35 minutos y el nivel de lectura. No equivale a validación o patrocinio del SII, TGR, MINEDUC ni municipalidades.

## Comprobar

Ejecutar `pnpm seo:routes`, `pnpm build` y `pnpm test`. Las pruebas cubren integridad del contenido, avance de las siete misiones, ayuda y reintentos, aprendizaje independiente, completar con errores sin conceder dominio, y recuperación de almacenamiento. Las pruebas previas de autenticación, progreso y SEO también se mantienen.

Revisión en navegador: recorrido desde avatar/apodo hasta las siete insignias y reconocimiento; errores de clasificación y orden, glosario y regreso, casos nuevos tras ayuda, recarga y continuación, reinicio con conservar/confirmar, vista móvil, foco y teclado, integración en catálogo/módulo y portada original.


## Actualización: cuentas escolares

La nueva versión sustituye el guardado local de esta aventura por la integración Supabase descrita en `cuentas-valle-coihue.md`. Sin ese servicio configurado, el acceso está pendiente y no se habilita juego escolar ni se importan evidencias locales antiguas. Las referencias previas al pasaporte local describen la entrega anterior.
