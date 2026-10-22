# Publicación de misiones

Portada y explorador obtienen sus tarjetas del mismo selector `publicMissions`. Todas las especialidades participan. No se mantiene una lista manual de destacados. Las misiones se ordenan por fecha de publicación descendente, conservando el orden de catálogo para fechas iguales. La aventura tributaria mantiene su tarjeta de entrada propia.

Cada misión del catálogo jugable declara `publication: 'draft' | 'published'` y puede incluir `publishedAt` en formato AAAA-MM-DD. Esto es independiente del estado pedagógico (`pilot`, `review`, etc.): estar disponible no equivale a validación curricular.

Al incorporar una misión, sus recursos y rutas, y publicarla en el despliegue oficial con `publication: 'published'`, aparece automáticamente en destacados y explorador. Con `draft` queda excluida de ambos, de su ficha pública, del sitemap y del inicio de juego en servidor. No hay programación automática de fechas ni botón de publicación en administrador añadido por este cambio. Los módulos curriculares en planificación conservan sus propios borradores.

Camila usa su ilustración para la tarjeta. La portada ya no excluye Agropecuaria al seleccionar destacados.

Verificación: build de 33 páginas, 41 pruebas aprobadas. La prueba de publicación incorpora temporalmente una misión nueva y un borrador: confirma aparición automática de la publicada, orden por fecha y exclusión del borrador tanto en portada como en explorador; también rechaza iniciar el borrador en servidor.
