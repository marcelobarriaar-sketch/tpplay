# Reacciones visuales: piloto en el nivel 1

Los tres WebP entregados por Marcelo se publican con sus nombres estables en `public/game-reactions/`. No se modificaron las imágenes.

`src/games/reactions/reactions.ts` centraliza assets, tiempos y `sound: null` (sin reproducción de audio). `openingReactions` observa diferencias entre estados aceptados del primer nivel: recorrido eficiente y carpeta correcta → success; pérdida de caja o reputación → loss; ficha tributaria aprobada por Paula → siiSuccess. El texto del último caso dice «Encargo tributario preparado», porque esta etapa no presenta el aviso real ni termina el expediente completo. Los importes, XP y reputación son diferencias del estado del juego, nunca premios inventados.

`GameReaction.tsx` incluye `GameReaction` y `ReactionQueue`. La cola muestra un solo componente con clave de evento estable; la entrada dura 360 ms, la permanencia 3200/3500 ms y la salida 300 ms. El WebP no se reinicia al actualizar posición o estado ajeno. Los temporizadores se cancelan al desmontar y al abandonar el nivel se descarta la cola. Montar o recuperar una partida guardada no repite reacciones históricas. Un error de guardado no genera una reacción de éxito.

La capa se monta en `document.body`, con posición fija, z-index alto y pointer-events:none. Se prefiere la esquina inferior derecha y se buscan posiciones alternativas ante controles, enlaces, encabezados y HUD visibles. El tamaño móvil es 44% del ancho; si toda la pantalla está ocupada se utiliza la esquina con menor superposición, manteniendo siempre los controles interactivos. No se cambia el layout ni se atrapa el foco. Textos accesibles mediante status/polite y decoraciones con aria-hidden. `prefers-reduced-motion` desactiva las animaciones CSS adicionales; el WebP conserva su movimiento propio, como permite la especificación.

Solo se monta en `OpeningSimulation`, usado por invitado y alumno autenticado. La precarga se programa en tiempo ocioso al cargar ese nivel. No se añadieron servicios, sonidos, tablas, migraciones ni cambios al dinero, notas, evaluación, avance o API.

Para otras mascotas: agregar una entrada a `gameReactions`, colocar su asset y producir un `ReactionEvent` desde el adaptador de la misión correspondiente. La cola y el componente no dependen del nombre ni de la especie de la mascota. Mantener sonidos deshabilitados hasta definir una preferencia explícita del alumno.

Verificación: 79 pruebas automáticas aprobadas y compilación completa. Las pruebas nuevas cubren consecuencias monetarias, XP, reputación, aislamiento del nivel, no repetición, orden de cola y posicionamiento. Se comprobaron celebraciones y continuidad en el juego local, y el componente con eventos de prueba en un iframe de 390 px; esto no equivale a una prueba en teléfono físico. No se alteraron cuentas ni resultados de estudiantes en producción.
