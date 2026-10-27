# Camila: primera misión de simulación

## Alcance
El nivel 1 «El encargo de Camila» incorpora relato, diálogo, mapa, consecuencias, carpeta documental, ficha de gestión y recompensa. Los otros siete pasos y la evidencia final conservan su funcionamiento. La ficha inicial prepara el encargo: no da por presentado el aviso ni por obtenidos los permisos del restaurante.

## Componentes y datos
- `src/games/inicio/SimulationGame.tsx`: `GameHUD` y `OpeningSimulation`. Conserva la fotografía de Camila; permite arrastrar documentos y también seleccionarlos con clic, toque o teclado.
- `src/games/inicio/simulation.ts`: configuración `openingMission`, lugares `openingPlaces`, documentos `openingDocuments`, estados, acciones y reductor compartido `applySimulation`. `simulationSummary` calcula XP de gestión, reputación, jornadas e insignias.
- `src/Player.tsx` y `src/progress.ts`: ejecución y recuperación de invitados.
- `src/accounts/CloudMission.tsx` y `server/missionDomain.ts`: eventos validados por el servidor y guardados mediante el flujo existente con revisión e identificador de evento.
- `src/accounts/AcademicDashboard.tsx`: resumen de gestión en el detalle docente ya protegido.
- `src/styles.css`: estilos adaptables, foco visible y movimiento reducido.
- `supabase/migrations/012_camila_simulation.sql`: insignia «Primer paso formal» asociada al perfil, concedida al guardar el primer encargo terminado. No se concede por sumar XP genéricos.

## Persistencia y compatibilidad
Cada conversación, recorrido, asignación documental y campo de la ficha se guarda. Los premios y saldos se reconstruyen desde acciones válidas; no se aceptan importes o recompensas enviados por el cliente. Reintentar la misma revisión errónea no vuelve a penalizar. Los intentos antiguos que ya superaron el primer paso conservan su recorrido anterior.

La caja inicial sigue en $300 Coihues y la nota chilena mantiene su fórmula existente. Un recorrido municipal consume $20 Coihues; el de honorarios, $25. El resultado del primer recorrido conserva el peso de una decisión del desafío completo. La reparación permite continuar, pero no borra el costo ni convierte el primer error en un acierto. XP de gestión y reputación son indicadores adicionales del intento; no duplican los Coihues personales del ranking.

## Crear las siguientes misiones
1. Definir una configuración tipada siguiendo `SimulationStage`: título, misión, escenario, interacción, personajes, acciones correctas, XP, reputación, explicación, insignia y siguiente etapa. Lugares/opciones y documentos tienen colecciones separadas; los efectos monetarios reutilizan `economy.ts`.
2. Añadir las fases y transiciones válidas al reductor compartido. Una mecánica nueva requiere un componente o adaptador; esta entrega no pretende ser un editor sin código.
3. Renderizar el microjuego según etapa/interacción, manteniendo `GameHUD` y la misma API de eventos. Evitar alterar retrospectivamente versiones ya jugadas.
4. Asociar las acciones a la evaluación global existente; definir dinero y nota de forma explícita antes de publicarlas.
5. Añadir pruebas de secuencia, errores, reintentos, importación y guardado antes de habilitar el nuevo nivel.

Las compras, IVA, F29, eventos aleatorios y fiscalización ampliada son extensiones posteriores; no están activados en esta primera demostración.

## Verificación
75 pruebas automáticas aprobadas, incluida integración PostgreSQL local con PGlite: guardado canónico, insignia atómica, aislamiento entre estudiantes, evaluación y compatibilidad histórica. Compilación TypeScript y construcción de 33 páginas públicas correctas.

Prueba visual local en navegador: recorrido correcto completo, recuperación de campos tras recarga, recompensa y continuidad al nivel 2. Recorrido municipal con descuento único y recuperación tras recarga. Diseño a 390 píxeles mediante iframe de comprobación sin desbordamiento horizontal; no equivale a una prueba en un teléfono físico.

No se ha ejecutado una partida en producción con una sesión real de estudiante ni se ha inspeccionado en vivo su nuevo resultado desde una sesión docente. La integración de almacenamiento y consulta está cubierta por pruebas locales; no se crearon alumnos ni resultados de prueba en producción.
