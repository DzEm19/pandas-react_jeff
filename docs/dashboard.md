# Documentacion del dashboard

Esta guia explica el codigo que construye el dashboard de la aplicacion. El lenguaje es tecnico, pero cada concepto se describe de forma directa.

## 1. Que hace el dashboard

El dashboard permite:

- cargar un archivo CSV desde el navegador;
- guardar el archivo activo durante la sesion de la pestaña;
- registrar un historial de archivos cargados;
- mostrar una vista previa de los datos;
- calcular un resumen basico del archivo;
- generar ejercicios relacionados con NumPy y Pandas;
- mostrar soluciones calculadas a partir del CSV;
- generar y descargar reportes de texto.

El dashboard no envia el CSV a un servidor. El procesamiento ocurre en el navegador y la persistencia se hace con Web Storage.

## 2. Entrada al dashboard y rutas

El archivo [AppRoutes.tsx](../src/routes/AppRoutes.tsx) registra el area administrativa bajo `/admin`.

| Ruta | Componente | Funcion |
| --- | --- | --- |
| `/admin` | `Dashboard` | Carga CSV, resumen, vista previa y ejercicios iniciales. |
| `/admin/archivos` | `CsvFiles` | Historial de archivos cargados. |
| `/admin/numpy` | `AnalysisSection` con `kind="numpy"` | Ejercicios y soluciones de NumPy. |
| `/admin/pandas` | `AnalysisSection` con `kind="pandas"` | Ejercicios y soluciones de Pandas. |
| `/admin/reporte` | `Report` | Perfil de columnas y calidad de datos. |

Todas estas rutas usan [DashboardLayout.tsx](../src/layouts/DashboardLayout.tsx). Este layout mantiene visible la barra lateral y coloca la pantalla activa dentro de `Outlet`.

La barra lateral usa `NavLink`. React Router agrega la clase `active` al enlace de la ruta actual. El enlace `Volver al Inicio` sale del area administrativa y vuelve a `/`.

## 3. Flujo completo de un CSV

1. El usuario pulsa `Subir archivo CSV` en `Dashboard`.
2. El campo real es un `input type="file"` oculto. La etiqueta visible abre ese campo.
3. `handleFileUpload` obtiene el primer archivo seleccionado.
4. `readCsvFromFile` lee el contenido con `file.text()`.
5. `parseCsvText` convierte el texto en encabezados y filas.
6. Si el archivo tiene encabezados, se crea un objeto `ParsedCsv`.
7. El objeto se guarda en `sessionStorage` y se añade una entrada a `localStorage`.
8. `Dashboard` actualiza su estado `uploaded`.
9. Los calculos derivados se vuelven a ejecutar y React actualiza la interfaz.
10. Las otras pantallas leen el mismo CSV activo cuando se montan.

Si el archivo esta vacio o no produce encabezados, `readCsvFromFile` devuelve `null` y la pantalla conserva su estado anterior.

## 4. Modelo de datos

El contrato principal esta en [csvStorage.ts](../src/services/csvStorage.ts):

```ts
export type CsvRow = Record<string, string>;

export type ParsedCsv = {
  fileName: string;
  headers: string[];
  rows: CsvRow[];
};
```

- `CsvRow` representa una fila. La clave es el nombre de una columna y el valor siempre es texto.
- `ParsedCsv` representa el archivo completo ya interpretado.
- `headers` conserva el orden de las columnas.
- `rows` contiene objetos con una propiedad por encabezado.

El historial usa `CsvHistoryEntry`, que guarda solo metadatos: nombre, fecha, cantidad de filas y cantidad de columnas. No guarda el contenido completo del archivo.

## 5. Parser CSV

`parseCsvText` realiza estas tareas:

- normaliza saltos de linea de Windows y macOS;
- elimina espacios exteriores y lineas vacias;
- elige `;` cuando la primera linea contiene punto y coma y no contiene coma; en los demas casos usa `,`;
- interpreta valores entre comillas;
- convierte `""` dentro de un valor entrecomillado en una comilla;
- crea nombres como `columna_1` cuando un encabezado esta vacio;
- completa con cadena vacia las celdas que faltan en una fila.

El parser es intencionalmente sencillo. No soporta campos entrecomillados que ocupen varias lineas porque primero separa el texto por saltos de linea. Tampoco valida que cada fila tenga exactamente el mismo numero de columnas.

## 6. Persistencia del navegador

[csvStorage.ts](../src/services/csvStorage.ts) usa dos claves:

- `dashboard-csv-upload`: CSV activo en `sessionStorage`. Normalmente desaparece al cerrar la pestaña.
- `dashboard-csv-history`: historial en `localStorage`. Permanece despues de cerrar el navegador hasta que se borre el almacenamiento.

`loadUploadedCsv` y `loadCsvHistory` usan `try/catch`. Si el JSON esta dañado o Web Storage genera un error, devuelven `null` o `[]` para que la interfaz pueda mostrar un estado vacio.

`readCsvFromFile` es la funcion de entrada para una carga. Ademas de devolver el resultado, guarda el CSV activo y registra el archivo en el historial.

## 7. Pantalla principal: `Dashboard.tsx`

### Funciones de conversion y estadistica

- `normalizeNumericValue`: elimina simbolos `$`, `%`, espacios y separadores de miles para facilitar la conversion a numero.
- `isNumericValue`: determina si un texto representa un numero utilizable.
- `toNumber`: convierte un valor normalizado a `number`.
- `getNumericColumnStats`: filtra los valores validos de una columna y calcula promedio, minimo, maximo y cantidad.
- `getColumnInsight`: transforma esas estadisticas en una frase visible para el usuario.
- `buildNumpyProblems`: genera seis peticiones de NumPy usando los nombres reales de las columnas.
- `buildPandasProblems`: genera seis peticiones de Pandas usando el mismo criterio.

Una columna se considera numerica si al menos una de sus filas contiene un valor numerico. Cuando no existe una columna numerica, se usan los primeros encabezados como alternativas para que los ejercicios sigan teniendo texto.

### Estado y calculos derivados

`uploaded` contiene el CSV activo o `null`.

El `useEffect` inicial llama a `loadUploadedCsv`, por eso el dashboard recupera el archivo disponible al recargar la ruta dentro de la misma pestaña.

`reportSummary`, `numpyProblems` y `pandasProblems` usan `useMemo`. Solo se recalculan cuando cambia `uploaded`. `reportSummary` calcula:

- total de filas;
- total de columnas;
- cantidad de valores vacios;
- columnas numericas;
- hasta cuatro mensajes de informacion clave.

### Renderizado

- Sin CSV: muestra `empty-state` y solicita una carga.
- Con CSV: muestra tarjetas de resumen, el reporte inicial, una tabla con las primeras cinco filas y dos columnas de ejercicios.
- `exportReport` construye texto plano, crea un `Blob`, simula un enlace de descarga y libera la URL temporal.

## 8. Archivos CSV: `CsvFiles.tsx`

Esta vista llama a `loadCsvHistory` una vez al montarse y mantiene el resultado en `history`.

- Si el historial esta vacio, muestra un estado vacio.
- Si tiene elementos, muestra una tabla.
- `formatDate` convierte la fecha ISO guardada por el servicio a una fecha legible en espanol de Mexico.

La pantalla no carga ni edita archivos. La carga siempre ocurre en `Dashboard`.

## 9. Ejercicios: `AnalysisSection.tsx`

`AnalysisSection` es una vista reutilizable. Recibe `kind`, cuyo valor solo puede ser `numpy` o `pandas`.

- `normalizeNumericValue` e `isNumericValue` preparan valores numericos.
- `numericValues` devuelve los valores numericos de una columna.
- `columnsFor` selecciona una columna primaria, una secundaria y una de texto.
- `buildProblems` crea seis ejercicios para el modo seleccionado.
- `solveProblem` calcula una respuesta simple para cada ejercicio.

La respuesta de Pandas es principalmente descriptiva: algunos ejercicios indican que una operacion quedaria preparada, pero no ejecutan Pandas real. La aplicacion esta simulando esas operaciones con TypeScript en el navegador.

## 10. Reporte: `Report.tsx`

`Report` vuelve a leer el CSV activo y crea `summary` con `useMemo`.

Para cada columna calcula un `ColumnProfile`:

- `type`: `Numérica` si encuentra al menos un numero; si no, `Texto`;
- `filled`: cantidad de celdas con contenido;
- `unique`: cantidad de valores distintos no vacios;
- `average`: promedio numerico o `null`.

Tambien calcula:

- valores vacios por columna;
- cantidad de filas completas;
- total de filas, columnas y valores vacios;
- lista de columnas numericas.

La barra de calidad representa `filas completas / filas totales * 100`. `downloadReport` exporta estas metricas como archivo de texto.

## 11. Estilos del dashboard

[Dashboard.css](../src/pages/Dashboard.css) contiene los estilos especificos de las pantallas de analisis:

- encabezado y acciones;
- estados vacios;
- tarjetas de resumen;
- secciones del reporte;
- tablas con desplazamiento horizontal;
- tarjetas de problemas;
- barra de calidad;
- adaptacion del encabezado para pantallas pequenas.

[index.css](../src/index.css) contiene los estilos compartidos del area administrativa:

- `.dash-layout`: contenedor general;
- `.dash-sidebar`: barra lateral fija;
- `.dash-main`: contenido con margen para la barra lateral;
- `.dash-page`, `.dash-card` y `.dash-table`: estilos usados por `CsvFiles`;
- reglas responsive para reducir la barra lateral en pantallas de hasta `768px`.

Los componentes importan `Dashboard.css` cuando necesitan sus clases. `index.css` se carga globalmente desde la entrada de la aplicacion.

## 12. Consideraciones y limites actuales

- El CSV se procesa en el cliente y no existe una API para subirlo.
- Los valores se mantienen como texto; cada pantalla decide cuando convertirlos a numero.
- La deteccion numerica acepta simbolos de moneda, porcentaje, espacios y comas.
- Una misma regla de conversion esta repetida en varias pantallas. Si cambia el formato numerico, conviene extraer esa logica a un servicio compartido.
- El historial crece sin limite y no tiene una accion de borrado.
- `sessionStorage` y `localStorage` dependen del navegador y de sus limites de capacidad.
- El dashboard no tiene autenticacion real en las rutas `/admin`; el acceso depende de la configuracion actual del router.

## 13. Como probarlo

```bash
npm run lint
npm run build
```

Para probar manualmente:

1. inicia la aplicacion con `npm run dev`;
2. abre `/admin`;
3. carga un CSV con encabezados;
4. revisa el resumen y la vista previa;
5. navega a Archivos CSV, NumPy, Pandas y Reporte;
6. descarga ambos tipos de reporte;
7. recarga la pagina y comprueba que el CSV activo sigue disponible en la misma pestaña.
