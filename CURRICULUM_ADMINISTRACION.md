# Administración · Referente curricular TP PLAY

Revisión documental: **21 de octubre de 2026**. Versión: **2026.10.1**.

## Identidad y alcance

Sector y especialidad: Administración. Menciones oficiales: Recursos Humanos y Logística. TP PLAY desarrolla aquí Recursos Humanos: seis módulos de plan común en 3.º medio y cinco de mención en 4.º. El capítulo de Aplicaciones informáticas señala 114 horas (pp. 96–97), mientras la tabla inicial p. 19 imprime 144. Se utiliza 114, coherente con el total de referencia de 836; no se oculta esta discrepancia de la fuente. La distribución de referencia suma 836 horas por nivel; no son duraciones de juego ni una programación escolar obligatoria. No se desarrolla Logística ni se profundizan otras especialidades.

Esta entrega consolida la arquitectura y la navegación de los once módulos, no todas las actividades necesarias para impartir la especialidad. Hay tres experiencias existentes y veinticinco propuestas; no se anuncian como 28 misiones terminadas. Cada establecimiento debe contextualizar su planificación y comprobar las disposiciones que le sean aplicables.

## Fuentes oficiales y trazabilidad

1. [Programa de Estudio Administración, menciones Recursos Humanos y Logística](https://www.curriculumnacional.cl/614/articles-34310_programa.pdf), Mineduc, primera edición octubre 2015, Decreto Exento 0954/2015. Se descargó y examinó el documento de 208 páginas. Paginación **impresa**: sector y normativa en preliminares; OA del plan común p. 16; OA de mención p. 17; plan RH p. 19; visión global pp. 21–26; GCT y criterios pp. 57–58. El índice y la paginación PDF tienen un desplazamiento de dos páginas.
2. [Ficha Biblioteca Digital Mineduc](https://bibliotecadigital.mineduc.cl/handle/20.500.12365/316), registro alternativo del programa. La descarga directa de ese repositorio devolvió 403; se utilizó el PDF oficial de Currículum Nacional.
3. [Especialidad Administración, mención Recursos Humanos](https://www.curriculumnacional.cl/curriculum/3o-4o-medio-tecnico-profesional/especialidad-administracion-mencion-recursos-humanos), portal curricular oficial consultado para contrastar niveles y acceso al programa.
4. Bases Curriculares EMTP: Decreto Supremo 452/2013, identificado en el programa, especialmente pp. 16–17. No se adjudica carácter oficial a las adaptaciones de TP PLAY.
5. [Tasa IVA, SII, pregunta 001.130.0572](https://www.sii.cl/preguntas_frecuentes/impuestos_mensuales/001_130_0572.htm), actualización de la fuente 10 junio 2025; consulta 21 octubre 2026. Para este caso se mantiene 19%; no se extrapola a todas las operaciones ni se modifican resultados históricos.

Las fichas web contienen variantes como «Proceso administrativo» o «Desarrollo y bienestar personal». Para denominaciones del mapa se privilegió el plan de estudio del programa, p. 19. El perfil de egreso OA 4 RH menciona inducción básica; la visión global del módulo describe selección. Se referencian sus alcances por separado, sin fusionarlos como una cita literal única.

## Convenciones

- Especialidad → mención → nivel → módulo oficial → experiencia/misión → actividad/etapa.
- `src/administrationCurriculum.ts` es la fuente maestra de nombres, niveles, OA resumidos, aprendizajes resumidos, fuentes, revisiones, estados y roadmap. Los nombres amigables no reemplazan la denominación oficial visible.
- `src/data.ts` conserva las misiones jugables y su `slug` histórico. `curriculumId` enlaza con el catálogo maestro. La entrevista permanece transversal y se incorpora al mapa de Administración mediante una relación explícita, sin duplicar el juego ni los intentos.
- IDs: ADM + código del módulo + número de tres dígitos. Los IDs estables del motor de progreso no se renombran: el vínculo es aditivo.
- Estados: draft, curricular_review, pedagogical_review, pilot, published, archived. El roadmap nuevo queda draft; las tres experiencias disponibles se presentan como pilot, no validadas pedagógicamente.
- El orden de módulos sigue el plan. El orden de experiencias es una propuesta editorial flexible, no una progresión obligatoria ministerial. No se inventan prerrequisitos ni se bloquean borradores por XP: están cerrados porque aún no existen.
- Las siete etapas internas de la aventura tributaria son una sola experiencia del roadmap. El motor existente conserva siete recompensas de 100 XP; no se cambia su economía ni su versión para modificar metadatos curriculares.
- `module_settings` conserva objetivos didácticos y orden editorial de experiencias disponibles. Se muestran separados de los referentes oficiales. Una falla del editor no oculta el currículo.

## Alineación de las experiencias existentes

- **Misión IVA → ADM-GCT → OA 1 plan común → AE 2 → práctica parcial de CE 2.1 y 2.2**, p. 58. Ordena respaldos y calcula un caso simplificado; no cubre CE 2.3 (declarar F29), renta anual, importaciones/exportaciones ni todas las condiciones reales del crédito fiscal.
- **Tributos en Valle del Coihue → ADM-GCT → inducción conceptual**. La narrativa ayuda a diferenciar pagos, organismos y propósitos públicos. No hay evidencia suficiente para afirmar logro de OA 1, AE 2 o un criterio completo: alineación específica pendiente.
- **Tu primera entrevista → ADM-EYE → AE 3, alcance parcial**, p. 26. Preparación para incorporarse al trabajo. Este módulo se relaciona inicialmente con objetivos genéricos EMTP, sin inventarle un OA numerado propio de especialidad.

Los indicadores observables internos y el XP no son notas, certificaciones ni criterios ministeriales nuevos. La evidencia abierta requiere revisión docente.

## Normativa y mantenimiento

`src/normativeReferences.ts` centraliza tasa del caso, fuente SII y fechas, además de enlaces de consulta para valores indexados y legislación laboral. Los montos del ejercicio IVA son datos ficticios, no indicadores económicos vigentes. No se incorporan salarios mínimos, UTM, topes previsionales o porcentajes laborales sin período y fuente.

Antes de editar una misión normativa: comprobar fuente, período aplicable y excepciones; revisar simultáneamente datos, respuestas, feedback y pauta; crear una nueva versión del contenido jugable si cambia el cálculo; conservar intentos anteriores. No cambiar una constante para recalcular retrospectivamente los resultados guardados. Revisar antes de cada pilotaje y ante cambios normativos. La revisión documental del mapa no equivale a revisión de cada norma citada dentro de la aventura anterior.

## Narrativa y futura cartografía

Oficina TP: información contable, procesos, archivo y herramientas digitales. Barrio comercial: atención y documentos/tributación. Empresa del Valle: legislación, remuneraciones, dotación y bienestar. Centro de emprendimiento: proyectos y trayectoria. `mission.location` contiene zona y edificio para un mapa futuro; no implica un nuevo mapa interactivo implementado. La aventura existente recorre varios lugares, incluido Barrio Cívico: sus lugares y personajes se conservan.

## Accesibilidad y capas

Capa estudiante: propósito, situación, estado y siguiente paso. Capa docente desplegable: referente, alcance parcial, metodología, evidencia, pautas pendientes, apoyos y fuentes. Teclado, encabezados y enlaces descriptivos; no se ocultan nombres oficiales solo en un tooltip. Etapas, pistas y tiempo flexible ya forman parte de las experiencias existentes. Audio y lectura simplificada son futuros apoyos, no prestaciones anunciadas como listas. Sin diagnósticos ni etiquetas médicas.

## Regla para futuras misiones

Usar MISSION_AUTHORING_GUIDE.md. Todo borrador necesita dueño editorial, módulo, propósito, evidencia y fuente; ningún OA/AE/CE se asigna por semejanza del título. Revisión curricular y pedagógica, pilotaje y controles técnicos preceden a published. No publicar una cifra normativa sin fecha ni una misión sin una alternativa accesible de participación.

## Estructura definitiva

|Nivel|Módulo oficial|Nombre TP PLAY|Existentes|Planificadas|
|---|---|---|---:|---:|
|3°|Utilización de información contable|Información contable|0|2|
|3°|Gestión comercial y tributaria|Gestión comercial y tributaria|2|2|
|3°|Procesos administrativos|Procesos administrativos|0|2|
|3°|Atención de clientes|Atención de clientes|0|2|
|3°|Organización de oficinas|Organización de oficinas|0|2|
|3°|Aplicaciones informáticas para la gestión administrativa|Herramientas digitales|0|2|
|4°|Legislación laboral|Legislación laboral|0|3|
|4°|Cálculo de remuneración, finiquitos y obligaciones laborales|Remuneraciones y finiquitos|0|4|
|4°|Desarrollo y bienestar del personal|Bienestar del personal|0|2|
|4°|Dotación de personal|Dotación de personal|0|2|
|4°|Emprendimiento y empleabilidad|Emprendimiento y empleabilidad|1|2|

## Roadmap de experiencias

|ID|Nivel|Módulo|Misión|Propósito|Estado|Orden sugerido|
|---|---|---|---|---|---|---:|
|ADM-UIC-001|3°|ADM-UIC|Las cuentas del almacén|Distinguir ingresos, costos y respaldos.|Borrador · por desarrollar|1|
|ADM-UIC-002|3°|ADM-UIC|Una decisión con números|Interpretar un informe contable sencillo.|Borrador · por desarrollar|2|
|ADM-GCT-001|3°|ADM-GCT|Tributos en Valle del Coihue|Reconocer el sentido de los tributos y los organismos que intervienen.|Pilotaje · disponible|3|
|ADM-GCT-002|3°|ADM-GCT|Misión IVA|Distinguir compras, ventas, débito y crédito en un caso simplificado.|Pilotaje · disponible|4|
|ADM-GCT-003|3°|ADM-GCT|Documentos que cruzan fronteras|Organizar antecedentes mercantiles de una importación ficticia.|Borrador · por desarrollar|5|
|ADM-GCT-004|3°|ADM-GCT|Del registro al F29|Preparar antecedentes y revisar un formulario simulado, sin declarar impuestos reales.|Borrador · por desarrollar|6|
|ADM-PAD-001|3°|ADM-PAD|Organiza la feria del Valle|Construir un programa con tareas, responsables y recursos.|Borrador · por desarrollar|7|
|ADM-PAD-002|3°|ADM-PAD|El plan cambió|Ajustar y comunicar avances usando evidencia.|Borrador · por desarrollar|8|
|ADM-ACL-001|3°|ADM-ACL|Escuchar antes de responder|Identificar la necesidad de un cliente.|Borrador · por desarrollar|9|
|ADM-ACL-002|3°|ADM-ACL|Una solicitud entre equipos|Derivar y responder un requerimiento interno.|Borrador · por desarrollar|10|
|ADM-OOF-001|3°|ADM-OOF|Encuentra el documento|Diseñar un sistema simple de clasificación.|Borrador · por desarrollar|11|
|ADM-OOF-002|3°|ADM-OOF|Una oficina para colaborar|Organizar el espacio de trabajo con criterios acordados.|Borrador · por desarrollar|12|
|ADM-AIG-001|3°|ADM-AIG|La planilla confiable|Validar datos y fórmulas de un registro.|Borrador · por desarrollar|13|
|ADM-AIG-002|3°|ADM-AIG|Un informe que se entiende|Comunicar resultados con herramientas digitales.|Borrador · por desarrollar|14|
|ADM-LL-001|4°|ADM-LL|Antes de firmar|Reconocer cláusulas y antecedentes de un contrato ficticio.|Borrador · por desarrollar|15|
|ADM-LL-002|4°|ADM-LL|Del contrato a la carpeta|Organizar la documentación laboral y su tramitación.|Borrador · por desarrollar|16|
|ADM-LL-003|4°|ADM-LL|Un cierre responsable|Revisar los documentos del término de una relación laboral.|Borrador · por desarrollar|17|
|ADM-REM-001|4°|ADM-REM|Lee tu liquidación|Distinguir haberes y descuentos en un caso ficticio.|Borrador · por desarrollar|18|
|ADM-REM-002|4°|ADM-REM|La remuneración paso a paso|Calcular una liquidación con parámetros del caso.|Borrador · por desarrollar|19|
|ADM-REM-003|4°|ADM-REM|Finiquito con respaldo|Justificar cálculos según causal y antecedentes simulados.|Borrador · por desarrollar|20|
|ADM-REM-004|4°|ADM-REM|Obligaciones al día|Identificar obligaciones y verificar sus respaldos.|Borrador · por desarrollar|21|
|ADM-DBP-001|4°|ADM-DBP|Un plan para aprender|Organizar antecedentes de capacitación.|Borrador · por desarrollar|22|
|ADM-DBP-002|4°|ADM-DBP|Bienestar con información responsable|Tramitar una solicitud con datos ficticios mínimos.|Borrador · por desarrollar|23|
|ADM-DPE-001|4°|ADM-DPE|¿Qué necesita el equipo?|Construir una descripción de cargo con criterios pertinentes.|Borrador · por desarrollar|24|
|ADM-DPE-002|4°|ADM-DPE|Un proceso transparente|Organizar antecedentes ficticios de reclutamiento sin sesgos.|Borrador · por desarrollar|25|
|ADM-EYE-001|4°|ADM-EYE|Tu primera entrevista|Comunicar habilidades con ejemplos y reconocer lo que falta aprender.|Pilotaje · disponible|26|
|ADM-EYE-002|4°|ADM-EYE|Una idea para el Valle|Proponer un proyecto con acciones y presupuesto.|Borrador · por desarrollar|27|
|ADM-EYE-003|4°|ADM-EYE|Tu siguiente paso|Comparar oportunidades de formación y financiamiento.|Borrador · por desarrollar|28|
