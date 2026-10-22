# La primera apertura: expediente Coihue

Experiencia de pilotaje para 3.º medio Administración, módulo Gestión comercial y tributaria (ADM-GCT-005). Ruta: `/desafios/inicio-actividades`. Juego: `/desafios/inicio-actividades/jugar`.

## Historia y mecánica

Camila Soto prepara el restaurante ficticio La Mesa del Coihue en Avenida Coihue 120, Villa del Coihue. El estudiante conecta el restaurante, la oficina ficticia del SII y un portal de práctica. Paula orienta en la oficina; Elena coordina una eventual visita y sale desde allí. Explorar los lugares no sustituye resolver las decisiones. Sin límite de tiempo.

1. El encargo de Camila: distinguir aviso tributario de otros permisos.
2. Dos puertas, un mismo servicio: internet y orientación de la oficina.
3. La actividad detrás del letrero: describir la operación real.
4. El reloj del expediente: interpretar un plazo en un caso fechado.
5. La mesa de los respaldos: combinar tarjetas, detectar un domicilio descartado y proteger credenciales. Las 16 combinaciones tienen devolución.
6. Portal de práctica: contrastar actividad, domicilio y fecha antes del envío simulado.
7. La fiscalizadora sale de la oficina: distinguir aviso y verificación; visita coordinada cuando corresponda.
8. La apertura responsable: conservar antecedentes y reconocer competencias de otras autoridades.
9. La nota para Camila: explicación escrita pendiente de revisión docente, sin calificación automática.

Los ocho criterios automáticos se separan de la evidencia escrita. Se reutiliza el motor de misiones y sus recompensas sin duplicación. Las tarjetas son controles accesibles por teclado y táctiles, no dependen de arrastrar.

## Alcance y fuentes

No presenta declaraciones reales, no pide RUT, claves ni archivos personales. No usa identidad gráfica oficial ni emite permisos o certificados. La vinculación curricular es preparatoria y parcial: requiere validación docente del criterio específico; completar no acredita dominio del OA.

Revisión documental: 21 de octubre de 2026. Contrastar nuevamente antes de su uso en aula:

- [SII: aviso de inicio por internet](https://www.sii.cl/preguntas_frecuentes/rut_inicio_actividades/001_105_3790.htm).
- [SII: antecedentes y eventual visita coordinada](https://www.sii.cl/preguntas_frecuentes/rut_inicio_actividades/001_105_1920.htm).
- [SII: primera emisión y verificación de actividad](https://www.sii.cl/preguntas_frecuentes/rut_inicio_actividades/001_105_6426.htm).
- [SII: ciclo del contribuyente](https://www.sii.cl/destacados/educacion/ciclo_vida_contribuyente/paso_02.html).
- [SII: ejemplo de plazo por meses](https://www.sii.cl/ayudas/nuevos_contribuyentes/boleta-honorarios.html). Se usa para explicar el calendario, sin convertir al restaurante en un caso de honorarios.

## Verificación y límites

Build completado: 33 páginas públicas. 34 pruebas aprobadas, incluyendo avance secuencial, combinaciones documentales, restauración del checkpoint, rechazo de resultados falsificados, identidad/RLS y recompensas sin duplicación.

Recorrido local de invitado probado a 390 × 844: ocho decisiones, evidencia, resultado 8/8 y 100 XP; recarga conserva selección intermedia, resultado y XP. Sin desborde horizontal. La evidencia escrita queda pendiente de revisión.

El jugador autenticado integra los mismos controles en CloudMission y conserva el API/RPC existente; no se agregan tablas ni migraciones. El guardado autenticado de esta misión no se ha probado extremo a extremo en Preview: faltan allí las variables de Supabase. No se presenta como verificado.

Entrega por rama y Preview dependiente del PR #9. No se publica en producción ni se fusiona automáticamente. Pendiente pilotaje docente y validación con estudiantes.
