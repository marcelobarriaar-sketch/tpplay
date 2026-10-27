# Camila: continuidad jugable de las etapas 2 a 8

El desafío mantiene sus ocho decisiones y su explicación final. No se agregan compras, IVA ni F29 ajenos a estos contenidos. Una misión completa sigue generando una nota, con la política 80% gestión de recursos y 20% explicación ya instalada.

## Interacciones
- Etapa 2: organizar la mesa de trabajo (oficina/restaurante) y el destino del expediente con Paula. El canal se incorpora a un recorrido construido.
- Etapa 3: reconstruir la descripción mediante operaciones del restaurante y contrastarla con el catálogo; el nombre del letrero no reemplaza la actividad.
- Etapa 4: colocar/arrastrar meses en una agenda, con selección por teclado/toque equivalente, y programar el cierre del plazo.
- Etapa 5: distribuir cuatro documentos entre carpeta y descarte. Arrastre o selección y destino por toque/teclado.
- Etapa 6: construir el resumen del portal cruzando actividad, domicilio y fecha con los documentos archivados.
- Etapa 7: abrir la solicitud de Elena, recuperar la carpeta anterior, preparar antecedentes y proteger las credenciales al responder.
- Etapa 8: archivar el trámite y organizar un tablero de consultas por institución, evitando dar por obtenidos todos los permisos.
- Etapa 9: bitácora escrita «Explícaselo a Camila», conservando rúbrica, intentos y confirmación para continuar con resultado bajo.

La caja, XP, reputación y jornada siguen visibles. Los errores y costos se conservan al avanzar. La consecuencia aparece después de confirmar; una vista permite consultar lo que se hizo. El siguiente botón permanece en una barra al pie. Al cambiar de etapa o confirmar, el foco lleva al contexto o a la consecuencia, sin desplazamientos animados obligatorios.

## Arquitectura
`management.ts` define configuración, campos admitidos, proyección al criterio existente y reductor puro `applyManagement`. `ManagementGame.tsx` presenta los microjuegos y `ManagementRecord` muestra un registro legible en resultados y en el detalle docente. `Player.tsx` y `CloudMission.tsx` usan el mismo componente. `missionDomain.ts` valida eventos `manage`, reconstruye las respuestas y verifica la confirmación. `progress.ts` extiende el JSON del intento con `management.version` y `drafts` por etapa. No requiere tablas, migraciones ni credenciales nuevas.

Cada cambio con impacto en la gestión se guarda: campos de la agenda, piezas de actividad, destinos documentales y decisiones del expediente. La selección transitoria de una tarjeta o mes, antes de colocarlo, es solo foco de interacción. Importar vuelve a validar los campos y deriva las respuestas; no acepta puntajes enviados por el cliente. Los intentos históricos mantienen respuestas y resultados; una selección antigua sin confirmar se reconstruye al retomar la etapa.

Se conservan los códigos de evaluación y los costos existentes: las tareas construidas proyectan su resultado a la misma rúbrica. Cuando se combinan errores, la categoría existente prioriza actividad frente a domicilio en el resumen, privacidad frente a promesas de autorización al responder a Elena, y autorizaciones supuestas frente a multa automática al planificar la apertura. No se acumulan multas nuevas por cada clic. El registro conserva todos los campos para revisar la decisión completa. Las reacciones WebP continúan limitadas a la etapa 1.

Para ampliar: definir campos permitidos y mecánica en `managementStages`, derivación en `managementAnswer`, interfaz correspondiente y etiquetas en el registro. Añadir pruebas de persistencia, proyección, costo único e importación antes de publicar una nueva interacción.

## Validación
Recorrido completo local en navegador desde la etapa 1 hasta resultados: una mala decisión en etapa 2 dejó $285 Coihues y se mantuvo hasta el cierre. Se verificó recuperación de una mesa de trabajo incompleta tras recarga, reutilización de la carpeta, explicación baja, confirmación de cierre y registro de las siete nuevas etapas en resultados.

Interacción por toque a 390 píxeles mediante iframe: archivo de cuatro documentos, bandejas y botón visible, sin desbordamiento. No equivale a una prueba en teléfono físico. Las pruebas de integración PostgreSQL local verifican que los campos `management` se guardan mediante `commit_mission` y se confirman sin perder el estado. No se crearon alumnos ni resultados de prueba en producción; falta una partida en vivo con sesión real de alumno y su posterior consulta por el docente.

Resultado de verificación final: 86 pruebas aprobadas y compilación TypeScript/Vite correcta, con 33 páginas públicas generadas. La integración PostgreSQL probó guardado y confirmación de la etapa 2 con la nueva estructura; los resultados cerrados ya no ofrecen reintentos dentro del mismo intento. No se modifica la base de datos ni se requiere migración para esta ampliación.
