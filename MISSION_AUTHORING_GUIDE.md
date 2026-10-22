# Estándar de autoría de misiones TP PLAY

## Ficha antes del código

1. ID estable, slug, especialidad, mención, nivel y moduleId del catálogo oficial.
2. Contexto ficticio situado en el Valle: zona, edificio y personaje solo si ayudan al aprendizaje.
3. Problema concreto que requiere interpretar datos y tomar decisiones.
4. Objetivo de la experiencia en lenguaje estudiantil. Diferenciarlo del OA oficial.
5. Alineación: fuente, página impresa, OA/AE/CE realmente aplicables y evidencia que los respalda. Si falta sustento: **Alineación curricular pendiente de revisión**. No asignar OA por intuición ni certificar el módulo completo.
6. Instrucciones breves por etapas, criterios de avance y apoyos disponibles.
7. Decisiones con alternativas plausibles; evitar adivinanzas, trampas o datos insuficientes.
8. Feedback que explique consecuencias y cómo mejorar, tanto para respuestas correctas como incorrectas. Ayudas sin castigos.
9. Evidencia propia: justificar decisiones, producto breve o registro; usar datos ficticios y evitar información personal sensible.
10. Cierre con reflexión y transferencia a otro caso, sin confundir terminación con dominio.
11. XP y reglas de repetición coherentes con el servidor; nunca aceptar puntos enviados libremente por navegador.
12. Versión del contenido, fecha de actualización y revisión, responsable, estado y duración estimada diferenciada de la medida en pilotaje.
13. Bibliografía y fuente normativa oficial; período y excepciones. Documentar qué queda fuera del caso.

## Dos capas

Estudiante: situación → decisión → explicación → evidencia → cierre. Docente: OA/AE/CE resumidos y enlazados, metodología, recursos, criterios observables, sugerencia de aplicación, pauta y alternativas de evidencia. Las pautas completas futuras deben protegerse cuando formen parte de una evaluación; no simular que ya están implementadas. El feedback formativo existente puede ser público.

## Estados y salida

- draft: propuesta, sin botón de juego si no está implementada.
- curricular_review: contraste de nombres, nivel, fuentes, alcance y vigencia.
- pedagogical_review: revisión de instrucciones, casos, alternativas y criterios por docente del área.
- pilot: experiencia disponible con límites explícitos y duración aún estimada.
- published: decisión editorial documentada tras revisión y pilotaje, no respaldo oficial de Mineduc.
- archived: conservar versión y resultados; redirigir o explicar retiro, sin borrar intentos.

No avanzar estados automáticamente por una prueba de código aprobada. La revisión documental del mapa no acredita validación pedagógica de los juegos.

## Checklist de aceptación

Comprobar ruta anterior y nueva, fuentes navegables, teclado, foco visible, contraste, móvil, instrucciones comprensibles, labels, ausencia de horizontales involuntarios, alternativas de evidencia y tiempo flexible. Probar respuestas equivocadas, ayudas, reintento, fallo de red, guardado confirmado y progreso posterior al recargar. No falsear datos históricos al cambiar versión. Las pruebas curriculares deben detectar módulos inventados, IDs duplicados, niveles erróneos y borradores presentados como disponibles.

## Datos y mantenimiento

Editar catálogo en src/administrationCurriculum.ts; contenidos jugables en sus motores actuales; parámetros en src/normativeReferences.ts. El catálogo no concede XP ni implementa misiones por sí solo. Toda nueva misión jugable requiere conectar el reductor del servidor, autorización, persistencia e idempotencia y ejecutar pruebas relevantes. Cambios de fórmulas o condiciones normativas requieren versión nueva y compatibilidad con intentos previos.
