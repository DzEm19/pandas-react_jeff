import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import './Dashboard.css';
import { loadUploadedCsv, readCsvFromFile, type CsvRow, type ParsedCsv } from '../services/csvStorage';

const normalizeNumericValue = (value: string): string => {
    // Convierte formatos comunes como "$1,200" o "25%" en texto numerico.
    return value.replace(/[$%\s]/g, '').replace(/,/g, '');
};

const isNumericValue = (value: string): boolean => {
    if (!value || value.trim() === '') {
        return false;
    }

    const normalized = normalizeNumericValue(value);
    return normalized !== '' && !Number.isNaN(Number(normalized));
};

const toNumber = (value: string): number => Number(normalizeNumericValue(value));

const getNumericColumnStats = (columnName: string, rows: CsvRow[]) => {
    // Ignora celdas vacias o no numericas para que una columna mixta
    // pueda producir estadisticas con los valores que si son validos.
    const values = rows
        .map((row) => row[columnName])
        .filter((value) => value !== undefined && value !== '' && isNumericValue(value))
        .map((value) => toNumber(value));

    if (values.length === 0) {
        return null;
    }

    const total = values.reduce((sum, value) => sum + value, 0);
    const average = total / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
        columnName,
        average,
        min,
        max,
        count: values.length,
    };
};

const getColumnInsight = (columnName: string, rows: CsvRow[]) => {
    const stats = getNumericColumnStats(columnName, rows);
    if (!stats) {
        return `La columna ${columnName} no tiene valores numéricos suficientes para analizar.`;
    }

    return `En ${columnName}, el promedio es ${stats.average.toFixed(2)}, el mínimo es ${stats.min} y el máximo es ${stats.max}.`;
};

const buildNumpyProblems = (headers: string[], rows: CsvRow[]) => {
    // Usa las columnas reales del CSV para crear ejercicios adaptados al archivo.
    // Si faltan columnas numericas, conserva nombres de respaldo para no dejar
    // la pantalla sin contenido.
    const numericColumns = headers.filter((header) => rows.some((row) => isNumericValue(row[header] ?? '')));
    const primaryColumn = numericColumns[0] ?? headers[0] ?? 'columna_1';
    const secondaryColumn = numericColumns[1] ?? headers[1] ?? 'columna_2';
    const textColumn = headers.find((header) => !numericColumns.includes(header)) ?? headers[0] ?? 'columna_1';

    const examples = [
        `Usando NumPy, crea un arreglo con los valores de la columna ${primaryColumn} y calcula su media aritmética.`,
        `Convierte la columna ${secondaryColumn} a un arreglo de NumPy y encuentra el valor máximo del conjunto.`,
        `Calcula la desviación estándar del arreglo generado desde ${primaryColumn}.`,
        `Obtén la suma total de los datos de ${primaryColumn} usando NumPy y explica el resultado.`,
        `Ordena ascendentemente los valores de ${secondaryColumn} y muestra la diferencia entre el primer y último elemento.`,
        `Crea un arreglo con los valores de ${textColumn} y determina cuántas veces aparece el valor más frecuente en el conjunto.`,
    ];

    return examples.map((problem, index) => ({
        id: `numpy-${index + 1}`,
        title: `Problema NumPy ${index + 1}`,
        question: problem,
    }));
};

const buildPandasProblems = (headers: string[], rows: CsvRow[]) => {
    // Selecciona columnas numericas y de texto para construir seis ejercicios
    // de filtrado, agrupacion, ordenamiento y seleccion de columnas.
    const numericColumns = headers.filter((header) => rows.some((row) => isNumericValue(row[header] ?? '')));
    const primaryColumn = numericColumns[0] ?? headers[0] ?? 'columna_1';
    const secondaryColumn = numericColumns[1] ?? headers[1] ?? 'columna_2';
    const firstTextColumn = headers.find((header) => !numericColumns.includes(header)) ?? headers[0] ?? 'columna_1';

    const examples = [
        `Carga el archivo CSV y muestra las primeras 5 filas del DataFrame con Pandas.`,
        `Filtra los registros donde ${primaryColumn} sea mayor que el promedio de esa columna y muestra el resultado.`,
        `Agrupa por ${firstTextColumn} y calcula la media de ${secondaryColumn}.`,
        `Identifica cuántos valores nulos existen en cada columna del DataFrame.`,
        `Ordena el DataFrame por ${primaryColumn} de forma descendente y muestra los 5 primeros registros.`,
        `Selecciona únicamente las columnas ${firstTextColumn} y ${secondaryColumn} y crea un DataFrame reducido.`,
    ];

    return examples.map((problem, index) => ({
        id: `pandas-${index + 1}`,
        title: `Problema Pandas ${index + 1}`,
        question: problem,
    }));
};

function Dashboard() {
    const [uploaded, setUploaded] = useState<ParsedCsv | null>(null);

    useEffect(() => {
        // El CSV activo vive en sessionStorage y se recupera al entrar de nuevo
        // en la pantalla mientras la pestaña del navegador siga abierta.
        const stored = loadUploadedCsv();
        if (stored) {
            setUploaded(stored);
        }
    }, []);

    const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        const parsed = await readCsvFromFile(file);
        if (!parsed) {
            return;
        }

        setUploaded(parsed);
    };

    const reportSummary = useMemo(() => {
        // Este resumen depende solo del archivo activo. useMemo evita repetir
        // el recorrido de todas las filas durante renders sin cambios de datos.
        if (!uploaded) {
            return null;
        }

        const totalRows = uploaded.rows.length;
        const totalColumns = uploaded.headers.length;
        const totalMissing = uploaded.rows.reduce((count, row) => {
            return count + Object.values(row).filter((value) => value === '').length;
        }, 0);

        const numericColumns = uploaded.headers.filter((header) =>
            uploaded.rows.some((row) => isNumericValue(row[header] ?? '')),
        );

        const insights = uploaded.headers.slice(0, 4).map((header) => getColumnInsight(header, uploaded.rows));

        return {
            totalRows,
            totalColumns,
            totalMissing,
            numericColumns,
            insights,
        };
    }, [uploaded]);

    const numpyProblems = useMemo(() => {
        if (!uploaded) {
            return [];
        }
        return buildNumpyProblems(uploaded.headers, uploaded.rows);
    }, [uploaded]);

    const pandasProblems = useMemo(() => {
        if (!uploaded) {
            return [];
        }
        return buildPandasProblems(uploaded.headers, uploaded.rows);
    }, [uploaded]);

    const previewRows = uploaded?.rows.slice(0, 5) ?? [];

    const exportReport = () => {
        // El reporte se genera en el cliente como texto plano y se descarga
        // mediante una URL temporal; no se necesita un endpoint del servidor.
        if (!uploaded || !reportSummary) {
            return;
        }

        const reportText = [
            'REPORTE 1',
            `Archivo: ${uploaded.fileName}`,
            `Filas: ${reportSummary.totalRows}`,
            `Columnas: ${reportSummary.totalColumns}`,
            `Valores nulos: ${reportSummary.totalMissing}`,
            `Campos numéricos: ${reportSummary.numericColumns.join(', ') || 'Ninguno'}`,
            '',
            'INFORMACIÓN CLAVE',
            ...reportSummary.insights.map((item) => `- ${item}`),
            '',
            'PROBLEMAS NUMPY',
            ...numpyProblems.map((problem, index) => `${index + 1}. ${problem.question}`),
            '',
            'PROBLEMAS PANDAS',
            ...pandasProblems.map((problem, index) => `${index + 1}. ${problem.question}`),
        ].join('\n');

        const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${uploaded.fileName.replace(/\.csv$/i, '')}_reporte1.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div>
                    <p className="eyebrow">Generador de análisis</p>
                    <h1>Dashboard NumPy + Pandas + Reporte</h1>
                </div>

                <div className="action-row">
                    {uploaded && (
                        <button className="secondary-button" type="button" onClick={exportReport}>
                            Descargar Reporte
                        </button>
                    )}
                    <label className="upload-button" htmlFor="csv-upload">
                        {uploaded ? 'Cambiar archivo CSV' : 'Subir archivo CSV'}
                    </label>
                </div>
                <input
                    id="csv-upload"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    hidden
                />
            </div>

            {!uploaded ? (
                <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <h2>Sube un archivo CSV para generar tu análisis</h2>
                    <p>Con una sola carga, el sistema genera 6 problemas de NumPy, 6 de Pandas y un Reporte 1.</p>
                </div>
            ) : (
                <>
                    <div className="summary-grid">
                        <div className="summary-card accent">
                            <span>Archivo</span>
                            <strong>{uploaded.fileName}</strong>
                        </div>
                        <div className="summary-card">
                            <span>Filas</span>
                            <strong>{reportSummary?.totalRows ?? 0}</strong>
                        </div>
                        <div className="summary-card">
                            <span>Columnas</span>
                            <strong>{reportSummary?.totalColumns ?? 0}</strong>
                        </div>
                        <div className="summary-card">
                            <span>Valores nulos</span>
                            <strong>{reportSummary?.totalMissing ?? 0}</strong>
                        </div>
                    </div>

                    <section className="report-section">
                        <div className="section-title-row">
                            <h2>Reporte 1</h2>
                            <span className="report-tag">Resumen del archivo</span>
                        </div>

                        <div className="report-grid">
                            <div className="report-card">
                                <h3>Resumen general</h3>
                                <ul>
                                    <li>Archivo cargado: <strong>{uploaded.fileName}</strong></li>
                                    <li>Registros analizados: <strong>{reportSummary?.totalRows}</strong></li>
                                    <li>Columnas detectadas: <strong>{reportSummary?.totalColumns}</strong></li>
                                    <li>Campos numéricos: <strong>{reportSummary?.numericColumns.length ?? 0}</strong></li>
                                </ul>
                            </div>

                            <div className="report-card">
                                <h3>Información clave</h3>
                                <ul>
                                    {reportSummary?.insights.map((insight, index) => (
                                        <li key={index}>{insight}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="table-section">
                        <div className="section-title-row">
                            <h2>Vista previa del CSV</h2>
                        </div>

                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        {uploaded.headers.map((header) => (
                                            <th key={header}>{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewRows.map((row, index) => (
                                        <tr key={`${index}-${row[uploaded.headers[0] ?? 'columna_1']}`}>
                                            {uploaded.headers.map((header) => (
                                                <td key={`${header}-${index}`}>{row[header] ?? '-'}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="problems-section">
                        <div className="problem-column">
                            <div className="section-title-row">
                                <h2>Problemas NumPy</h2>
                            </div>
                            <div className="problem-list">
                                {numpyProblems.map((problem) => (
                                    <article key={problem.id} className="problem-card">
                                        <span className="problem-chip numpy">NumPy</span>
                                        <h3>{problem.title}</h3>
                                        <p>{problem.question}</p>
                                    </article>
                                ))}
                            </div>
                        </div>

                        <div className="problem-column">
                            <div className="section-title-row">
                                <h2>Problemas Pandas</h2>
                            </div>
                            <div className="problem-list">
                                {pandasProblems.map((problem) => (
                                    <article key={problem.id} className="problem-card">
                                        <span className="problem-chip pandas">Pandas</span>
                                        <h3>{problem.title}</h3>
                                        <p>{problem.question}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

export default Dashboard;