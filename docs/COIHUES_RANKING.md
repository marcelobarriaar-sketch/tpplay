# Coihues y ranking · 22 de octubre de 2026

Coihues es la presentación narrativa del registro de XP existente: 1 XP = 1 Coihue. No es un segundo saldo, no se gasta ni tiene valor monetario. Se conservan las recompensas históricas: 100 por primera finalización y 50 por una mejora, una vez. No se descuentan por errores ni se altera el cálculo de logros.

`GET /api/learning?action=ranking` requiere identidad verificada y rol estudiante, igual que las otras acciones privadas. Lee únicamente recompensas de estudiantes activos. El cliente no envía puntos, identidades a consultar ni posiciones. No agrega tablas ni requiere migraciones. Se pagina todo el registro para no calcular un ranking parcial por el límite de 1000 filas; se rechaza expresamente el volumen superior al límite de seguridad.

El ranking global de estudiantes con recompensas no es público. Expone alias derivados mediante SHA-256 de identificadores aleatorios, no nombres, UUID, correos, escuela ni explicaciones. Los empates comparten puesto; la tabla muestra los primeros 50 y siempre incluye por separado el saldo y puesto de la cuenta actual. No se inventan participantes. Quien aún no tiene puntos aparece sin puesto.

Movimiento = puesto de referencia menos puesto actual. La referencia es la posición inmediatamente anterior a la última recompensa propia; si es la primera recompensa se usa la posición al obtenerla. Se reconstruye con las fechas del registro de recompensas. Las recompensas del mismo instante se consideran juntas. No pretende ser una animación o historial de cada cambio de puesto. Otros avances pueden hacer bajar el puesto sin disminuir el saldo.

Ruta privada `/ranking`, acceso desde Mi aventura y desde resultados; resumen al completar misiones y en la aventura tributaria. Refresco cada 30 segundos en pestaña visible y botón manual. No hay suscripción realtime ni notificaciones externas. Fallos muestran error, sin confirmar datos nuevos. La ruta no forma parte del sitemap y usa noindex como las demás rutas personales.

Relatos: se eliminan interrupciones sobre ficción del caso de Camila y de las otras narraciones. La ficha y las fuentes generales conservan la explicación educativa y el alcance del portal.

Verificación pendiente de integración: la Preview no tiene configuradas las variables de Supabase. La API y su autorización se verifican mediante adaptador de proveedor aislado; no se presenta el ranking con cuentas reales como operativo hasta comprobar esa conexión. Producción permanece sin cambios.

## Presupuesto y consecuencias · actualización

Inicio de actividades incorpora caja inicial de 300 Coihues independiente de las recompensas personales. Cada opción tiene impacto y corrección definidos; las 16 combinaciones de documentos suman costos por antecedentes faltantes, domicilio descartado y credencial. La selección anticipa el gasto; solo las respuestas confirmadas afectan el saldo. El saldo se deriva de respuestas guardadas, nunca de un importe enviado por el cliente. Recargas, confirmaciones repetidas y reintentos de red no multiplican gastos. No se cobran Coihues por pistas.

Los costos son parámetros del caso para representar traslados, demoras, correcciones y protección de accesos; no equivalen a montos legales, tarifas del SII ni multas automáticas. El libro de caja explica causa y siguiente paso. Un nuevo intento tiene un presupuesto nuevo; no elimina los resultados anteriores.

Los intentos nuevos llevan `economyVersion: 1` dentro del estado ya persistido; los intentos antiguos se conservan sin descuentos retroactivos e indican que se debe iniciar otro intento para jugar con presupuesto. No requiere nuevas tablas ni migraciones. La lógica financiera queda versionada para no cambiar costos de intentos anteriores en futuras ediciones.

Se agrega clasificación de gestión, separada de participación: mayor presupuesto conservado en una misión completa de Inicio de actividades, limitado a 300 por estudiante, sin sumar partidas repetidas. Solo participan intentos nuevos terminados y guardados por el servidor; se excluyen importaciones y versiones anteriores. Se permite mejorar mediante otro intento. La API reconstruye el mejor resultado desde respuestas/confirmaciones y no consulta explicaciones escritas ni acepta saldos del cliente. El movimiento se reconstruye desde la primera gestión y posteriores mejoras; una repetición peor no borra el mejor resultado.
