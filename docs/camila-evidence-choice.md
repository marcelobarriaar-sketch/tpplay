# Cierre voluntario de una explicación por reforzar

Tras la primera evaluación inferior a 80/100, el alumno puede volver a los contenidos o continuar con su mejor resultado. Menos de 60/100 activa la recomendación explícita de repasar. «Continuar con mi resultado» abre «¿Quieres continuar igual?»; solo «Sí, continuar y finalizar» cierra el intento. Cancelar conserva la posibilidad de revisar. El tercer intento bajo ya no cierra automáticamente. Un resultado de 80/100 o más conserva el cierre satisfactorio anterior.

Se guarda la aceptación con fecha, cantidad de evaluaciones y mejor puntaje. El servidor valida una confirmación ligada al resultado actual. El cierre utiliza la respuesta mejor evaluada, no un borrador sin evaluar; no borra errores ni sube puntajes. Volver a los contenidos desde una cuenta guarda antes el borrador. El docente ve la confirmación en el detalle.

## Nota real
La fórmula anterior de Camila solo utilizaba la caja. La nueva política `camila-evidence-20-v1`, marcada por el servidor al finalizar, pondera 80% del logro de gestión de recursos y 20% de la mejor explicación (0–100), y luego aplica la escala chilena configurada de 1 a 7. La caja y sus movimientos no cambian. El puntaje ponderado se identifica como tal en el panel académico. Un desafío sigue generando una nota; el libro mantiene su criterio de mejor intento completado.

Ejemplo con escala 0–300 y exigencia 60%: caja $300 y explicación 15/100 producen 249 puntos ponderados y nota 5,7. Caja $180 y explicación 0/100 producen 144 puntos y nota 3,4. No se inventa una pérdida de dinero por redactar mal.

La migración 013 sustituye el cálculo al guardar nuevos cierres que tengan esa política. No recalcula ni cambia resultados históricos cerrados; conserva la escala capturada del intento. El puntaje de la explicación se calcula en el servidor y las importaciones vuelven a evaluarse.

Archivos: EvaluationCard.tsx, evaluation.ts, Player.tsx, CloudMission.tsx, progress.ts, server/missionDomain.ts, grading.ts, AcademicDashboard.tsx y migración 013; pruebas de evaluación, persistencia e integración académica.

Verificación: 80 pruebas aprobadas, incluida confirmación anticipada, rechazo sin evaluar o con token obsoleto, persistencia de la aceptación, conservación de la mejor respuesta, ponderación SQL y notas históricas inmutables. Interacción visual comprobada mediante el componente real con una evaluación baja en una página de prueba local; ese archivo se retira antes de publicar. No se crean resultados de alumnos de prueba en producción.
