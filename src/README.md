Mr Rico — Sistema de Gestión

Estructura del proyecto creada para facilitar mantenimiento y desarrollo.

Estructura propuesta:

- src/
  - index.html       → punto de entrada (hoja de ruta / demo)
  - css/styles.css   → estilos compartidos (extraíbles desde el archivo original)
  - js/app.js        → lógica de la aplicación (extraíble desde el archivo original)

Archivos adicionales:

- mr_rico_restaurante.html  → copia original completa (backup)
- README.md                 → este fichero
- .gitignore                → archivos y carpetas ignoradas

Siguientes pasos sugeridos:

- Extraer el <style> y el <script> del archivo original a `src/css/styles.css` y `src/js/app.js` respectivamente, y actualizar `src/index.html` para enlazarlos.
- Añadir un paquete de build (opcional), pruebas o workflow CI (GitHub Actions).

Si quieres, realizo ahora la extracción completa y actualizo `src/index.html` para que use los ficheros separados (CSS & JS) y dejo la raíz limpia.
