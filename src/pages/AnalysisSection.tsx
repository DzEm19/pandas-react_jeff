import { useMemo, useState } from 'react';
import './Dashboard.css';
import { loadUploadedCsv, type CsvRow, type ParsedCsv } from '../services/csvStorage';

type AnalysisKind = 'numpy' | 'pandas';

// Aplica la misma limpieza numerica que Dashboard para que las soluciones
// interpretan de forma consistente importes, porcentajes y separadores.
const normalizeNumericValue = (value: string): string => value.replace(/[$%\s]/g, '').replace(/,/g, '');

// Identifica celdas numericas sin lanzar excepciones ante vacios o texto.
const isNumericValue = (value: string): boolean => {
    if (!value || value.trim() === '') return false;
    return !Number.isNaN(Number(normalizeNumericValue(value)));
};

// Extrae una columna como numeros y descarta valores que no puedan participar
// en las operaciones equivalentes a NumPy/Pandas.
const numericValues = (column: string, rows: CsvRow[]): number[] => rows
    .map((row) => row[column] ?? '')
    .filter(isNumericValue)
    .map((value) => Number(normalizeNumericValue(value)));

const columnsFor = (headers: string[], rows: CsvRow[]) => {
    // Los ejercicios necesitan una columna numerica y otra de texto. Se eligen
    // automaticamente para que funcionen con CSV de estructuras diferentes.
    const numericColumns = headers.filter((header) => rows.some((row) => isNumericValue(row[header] ?? '')));
    return {
        primary: numericColumns[0] ?? headers[0] ?? 'columna_1',
        secondary: numericColumns[1] ?? numericColumns[0] ?? headers[1] ?? 'columna_2',
        text: headers.find((header) => !numericColumns.includes(header)) ?? headers[0] ?? 'columna_1',
    };
};

const buildProblems = (kind: AnalysisKind, data: ParsedCsv) => {
    // Comparte seleccion de columnas y formato, pero cambia los enunciados
    // segun la herramienta elegida en la ruta.
    const columns = columnsFor(data.headers, data.rows);
    const { primary, secondary, text } = columns;

    const questions = kind === 'numpy'
        ? [
            [`Media de ${primary}`, `Crea un arreglo NumPy con ${primary} y calcula su media.`],
            [`Máximo de ${secondary}`, `Convierte ${secondary} en un arreglo NumPy y encuentra su valor máximo.`],
            [`Desviación estándar`, `Calcula la desviación estándar del arreglo de ${primary} usando NumPy.`],
            [`Suma total`, `Obtén la suma total de ${primary} con NumPy.`],
            [`Rango ordenado`, `Ordena ${secondary} y calcula la diferencia entre su primer y último valor.`],
            [`Frecuencia de ${text}`, `Cuenta cuántas veces aparece el valor más frecuente de ${text}.`],
        ]
        : [
            [`Primeras filas`, `Carga el CSV en Pandas y muestra sus primeras 5 filas.`],
            [`Filtro por promedio`, `Filtra los registros donde ${primary} sea mayor que su promedio.`],
            [`Agrupación`, `Agrupa por ${text} y calcula la media de ${secondary}.`],
            [`Valores nulos`, `Identifica cuántos valores nulos existen en cada columna.`],
            [`Orden descendente`, `Ordena por ${primary} de forma descendente y muestra los 5 primeros registros.`],
            [`DataFrame reducido`, `Selecciona las columnas ${text} y ${secondary}.`],
        ];

    return questions.map(([title, question], index) => ({
        id: `${kind}-${index + 1}`,
        title: `Ejercicio ${index + 1}: ${title}`,
        question,
        solution: solveProblem(kind, index, data, columns),
    }));
};

const solveProblem = (
    kind: AnalysisKind,
    index: number,
    data: ParsedCsv,
    columns: { primary: string; secondary: string; text: string },
): string => {
    // Las respuestas se calculan con TypeScript en el navegador. Representan
    // operaciones equivalentes a NumPy o Pandas, no una ejecucion de Python.
    const values = numericValues(columns.primary, data.rows);
    const secondaryValues = numericValues(columns.secondary, data.rows);

    if (kind === 'numpy') {
        if (index === 0) return `np.mean(${columns.primary}) = ${values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2) : 'sin datos numéricos'}.`;
        if (index === 1) return `np.max(${columns.secondary}) = ${secondaryValues.length ? Math.max(...secondaryValues) : 'sin datos numéricos'}.`;
        if (index === 2) {
            const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
            const deviation = values.length ? Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length) : null;
            return `np.std(${columns.primary}) = ${deviation === null ? 'sin datos numéricos' : deviation.toFixed(2)}.`;
        }
        if (index === 3) return `np.sum(${columns.primary}) = ${values.length ? values.reduce((sum, value) => sum + value, 0) : 'sin datos numéricos'}.`;
        if (index === 4) return secondaryValues.length ? `Rango = ${Math.max(...secondaryValues) - Math.min(...secondaryValues)} (${Math.min(...secondaryValues)} a ${Math.max(...secondaryValues)}).` : 'Sin datos numéricos para calcular el rango.';
        const frequencies = data.rows.reduce<Record<string, number>>((counts, row) => {
            const value = row[columns.text] ?? '';
            if (value) counts[value] = (counts[value] ?? 0) + 1;
            return counts;
        }, {});
        const mostFrequent = Object.entries(frequencies).sort((a, b) => b[1] - a[1])[0];
        return mostFrequent ? `${mostFrequent[0]} aparece ${mostFrequent[1]} veces.` : 'Sin valores para contar.';
    }

    if (index === 0) return `Se analizaron ${Math.min(5, data.rows.length)} filas de ${data.rows.length}.`;
    if (index === 1) return `Hay ${data.rows.filter((row) => isNumericValue(row[columns.primary] ?? '') && Number(normalizeNumericValue(row[columns.primary])) > (values.reduce((sum, value) => sum + value, 0) / (values.length || 1))).length} registros por encima del promedio.`;
    if (index === 2) return `Agrupación preparada por ${columns.text}; requiere una columna categórica y ${columns.secondary} numérica.`;
    if (index === 3) return `Valores vacíos detectados: ${data.headers.map((header) => `${header}: ${data.rows.filter((row) => !row[header]).length}`).join(', ')}.`;
    if (index === 4) return `Se ordenarían ${data.rows.length} registros por ${columns.primary} en orden descendente.`;
    return `DataFrame reducido con las columnas ${columns.text} y ${columns.secondary}, ${data.rows.length} filas.`;
};

function AnalysisSection({ kind }: { kind: AnalysisKind }) {
    // Lee una vez el CSV activo al montar la pagina; kind permite reutilizar
    // este componente para /numpy y /pandas sin duplicar la pantalla.
    const [uploaded] = useState<ParsedCsv | null>(() => loadUploadedCsv());

    // Las soluciones se calculan localmente cada vez que cambia la fuente o el
    // modo de analisis. No se ejecuta Python ni se llama a una API externa.
    const problems = useMemo(() => uploaded ? buildProblems(kind, uploaded) : [], [kind, uploaded]);
    const label = kind === 'numpy' ? 'NumPy' : 'Pandas';

    return (
        // La vista conserva las clases del dashboard para compartir estilos.
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div><p className="eyebrow">Ejercicios resueltos</p><h1>{label}</h1></div>
                {uploaded && <span className="report-tag">Fuente: {uploaded.fileName}</span>}
            </div>
            {/* Sin CSV no hay fuente para resolver; con CSV se listan peticion y respuesta. */}
            {!uploaded ? <div className="empty-state"><h2>Primero sube un archivo CSV</h2><p>Regresa al Dashboard para cargar los datos que alimentarán estos ejercicios.</p></div> : (
                <section className="problems-section single-problems-column">
                    <div className="problem-column"><div className="section-title-row"><h2>Petición y solución</h2><span className="report-tag">{problems.length} ejercicios</span></div>
                        <div className="problem-list">{problems.map((problem) => <article key={problem.id} className="problem-card"><span className={`problem-chip ${kind}`}>{label}</span><h3>{problem.title}</h3><p><strong>Petición:</strong> {problem.question}</p><p className="solution"><strong>Resuelto:</strong> {problem.solution}</p></article>)}</div>
                    </div>
                </section>
            )}
        </div>
    );
}

export default AnalysisSection;