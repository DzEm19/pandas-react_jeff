import { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './Dashboard.css';
import { loadUploadedCsv, type ParsedCsv } from '../services/csvStorage';

const normalize = (value: string) => value.replace(/[$%\s]/g, '').replace(/,/g, '');
// Determina si una celda puede incluirse en el perfil estadistico de su columna.
const isNumeric = (value: string) => value.trim() !== '' && !Number.isNaN(Number(normalize(value)));

type ColumnProfile = {
    header: string;
    type: 'Numérica' | 'Texto';
    filled: number;
    unique: number;
    average: number | null;
};

type NumericStat = {
    header: string;
    count: number;
    min: number;
    max: number;
    average: number;
    median: number;
    range: number;
};

function Report() {
    // El reporte usa el mismo CSV activo que Dashboard y AnalysisSection,
    // compartido mediante sessionStorage en lugar de propiedades entre rutas.
    const [uploaded] = useState<ParsedCsv | null>(() => loadUploadedCsv());
    const reportRef = useRef<HTMLDivElement | null>(null);

    const summary = useMemo(() => {
        // Recorre el CSV una vez por cambio de archivo y prepara tarjetas,
        // perfiles de columnas, tabla de vacios y barra de calidad.
        if (!uploaded) return null;
        const numericColumns = uploaded.headers.filter((header) => uploaded.rows.some((row) => isNumeric(row[header] ?? '')));
        const missingByColumn = uploaded.headers.map((header) => ({
            header,
            missing: uploaded.rows.filter((row) => !row[header]).length,
        }));
        const profiles: ColumnProfile[] = uploaded.headers.map((header) => {
            // El tipo se infiere por la presencia de un numero; vacios no
            // participan en el promedio ni en el conteo de valores unicos.
            const values = uploaded.rows.map((row) => row[header] ?? '');
            const numericValues = values.filter(isNumeric).map((value) => Number(normalize(value)));
            return {
                header,
                type: numericValues.length > 0 ? 'Numérica' : 'Texto',
                filled: values.filter(Boolean).length,
                unique: new Set(values.filter(Boolean)).size,
                average: numericValues.length > 0 ? numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length : null,
            };
        });
        const completeRows = uploaded.rows.filter((row) => uploaded.headers.every((header) => row[header])).length;
        const numericStats: NumericStat[] = uploaded.headers
            .map((header) => {
                const values = uploaded.rows
                    .map((row) => row[header] ?? '')
                    .filter(isNumeric)
                    .map((value) => Number(normalize(value)));

                if (values.length === 0) return null;

                const sorted = [...values].sort((a, b) => a - b);
                const middle = Math.floor(sorted.length / 2);
                const median = sorted.length % 2 === 0
                    ? (sorted[middle - 1] + sorted[middle]) / 2
                    : sorted[middle];
                const min = Math.min(...values);
                const max = Math.max(...values);
                const average = values.reduce((sum, value) => sum + value, 0) / values.length;

                return {
                    header,
                    count: values.length,
                    min,
                    max,
                    average,
                    median,
                    range: max - min || 1,
                };
            })
            .filter((value): value is NumericStat => value !== null);

        const qualityByColumn = uploaded.headers.map((header) => {
            const total = uploaded.rows.length || 1;
            const filled = uploaded.rows.filter((row) => Boolean(row[header])).length;
            const unique = new Set(uploaded.rows.map((row) => row[header]).filter(Boolean)).size;
            return {
                header,
                filledRate: (filled / total) * 100,
                uniqueRate: (unique / total) * 100,
            };
        });

        return {
            rows: uploaded.rows.length,
            columns: uploaded.headers.length,
            missing: missingByColumn.reduce((total, item) => total + item.missing, 0),
            numericColumns,
            numericStats,
            qualityByColumn,
            missingByColumn,
            profiles,
            completeRows,
        };
    }, [uploaded]);

    const downloadReport = () => {
        // Convierte el resumen en texto y dispara una descarga local con Blob;
        // el CSV y el reporte permanecen en el navegador.
        if (!uploaded || !summary) return;
        const content = [
            'REPORTE DEL CSV',
            `Archivo: ${uploaded.fileName}`,
            `Filas: ${summary.rows}`,
            `Columnas: ${summary.columns}`,
            `Valores vacíos: ${summary.missing}`,
            `Columnas numéricas: ${summary.numericColumns.join(', ') || 'Ninguna'}`,
            `Registros completos: ${summary.completeRows} de ${summary.rows}`,
            '',
            'PERFIL DE COLUMNAS',
            ...summary.profiles.map((profile) => `${profile.header}: ${profile.type}, ${profile.unique} valores únicos${profile.average !== null ? `, promedio ${profile.average.toFixed(2)}` : ''}`),
            '',
            'VALORES VACÍOS POR COLUMNA',
            ...summary.missingByColumn.map((item) => `${item.header}: ${item.missing}`),
        ].join('\n');
        const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${uploaded.fileName.replace(/\.csv$/i, '')}_reporte.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const exportAsImage = async () => {
        if (!uploaded || !reportRef.current) return;

        const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#f8fafc' });
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `${uploaded.fileName.replace(/\.csv$/i, '')}_reporte.png`;
        link.click();
    };

    const exportAsPdf = async () => {
        if (!uploaded || !reportRef.current) return;

        const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#f8fafc' });
        const imageData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imageData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imageData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;
        }

        pdf.save(`${uploaded.fileName.replace(/\.csv$/i, '')}_reporte.pdf`);
    };

    return (
        // Presenta el resumen calculado o explica que falta una carga inicial.
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div><p className="eyebrow">Análisis del archivo</p><h1>Reporte</h1></div>
                {uploaded && (
                    <div className="action-row">
                        <button className="secondary-button" type="button" onClick={downloadReport}>Descargar TXT</button>
                        <button className="secondary-button" type="button" onClick={exportAsPdf}>Descargar PDF</button>
                        <button className="secondary-button" type="button" onClick={exportAsImage}>Descargar PNG</button>
                    </div>
                )}
            </div>
            {/* La rama depende de la existencia del CSV activo. */}
            {!uploaded ? <div className="empty-state"><h2>Primero sube un archivo CSV</h2><p>Regresa al Dashboard para cargar los datos del reporte.</p></div> : (
                <div ref={reportRef}>
                    <div className="summary-grid">
                        <div className="summary-card accent"><span>Archivo</span><strong>{uploaded.fileName}</strong></div>
                        <div className="summary-card"><span>Filas</span><strong>{summary?.rows}</strong></div>
                        <div className="summary-card"><span>Columnas</span><strong>{summary?.columns}</strong></div>
                        <div className="summary-card"><span>Valores vacíos</span><strong>{summary?.missing}</strong></div>
                        <div className="summary-card"><span>Filas completas</span><strong>{summary?.completeRows}</strong></div>
                    </div>
                    <section className="report-section report-grid">
                        <div className="report-card report-highlight">
                            <div className="section-title-row"><h2>Calidad de datos</h2><span className="quality-badge">{summary && summary.rows > 0 ? Math.round((summary.completeRows / summary.rows) * 100) : 0}%</span></div>
                            <div className="quality-bar"><span style={{ width: `${summary && summary.rows > 0 ? (summary.completeRows / summary.rows) * 100 : 0}%` }} /></div>
                            <p>{summary?.completeRows} de {summary?.rows} registros están completos en todas sus columnas.</p>
                            <ul><li><strong>{summary?.numericColumns.length}</strong> columnas numéricas</li><li><strong>{(summary?.columns ?? 0) - (summary?.numericColumns.length ?? 0)}</strong> columnas de texto</li></ul>
                        </div>
                        <div className="report-card">
                            <h2>Lectura general</h2>
                            <ul><li>El archivo contiene <strong>{summary?.rows}</strong> registros para analizar.</li><li>Se detectaron <strong>{summary?.profiles.reduce((total, profile) => total + profile.unique, 0)}</strong> valores únicos entre todas las columnas.</li><li>{summary?.missing === 0 ? 'No se encontraron valores vacíos.' : `Se recomienda revisar ${summary?.missing} valores vacíos antes de un análisis avanzado.`}</li></ul>
                        </div>
                    </section>
                    <section className="report-section compact-chart-grid">
                        <div className="report-card compact-card">
                            <div className="section-title-row compact-header"><h2>Completitud</h2><span className="report-tag">Cobertura</span></div>
                            <div className="chart-list compact-list">
                                {summary?.missingByColumn.map((item) => {
                                    const completion = summary.rows > 0 ? ((summary.rows - item.missing) / summary.rows) * 100 : 0;
                                    return (
                                        <div className="chart-row" key={item.header}>
                                            <div className="chart-meta">
                                                <span>{item.header}</span>
                                                <strong>{completion.toFixed(0)}%</strong>
                                            </div>
                                            <div className="mini-bar"><span style={{ width: `${completion}%` }} /></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="report-card compact-card">
                            <div className="section-title-row compact-header"><h2>Valores únicos</h2><span className="report-tag">Diversidad</span></div>
                            <div className="chart-list compact-list">
                                {summary?.qualityByColumn.map((item) => (
                                    <div className="chart-row" key={item.header}>
                                        <div className="chart-meta">
                                            <span>{item.header}</span>
                                            <strong>{item.uniqueRate.toFixed(0)}%</strong>
                                        </div>
                                        <div className="mini-bar mini-bar-alt"><span style={{ width: `${Math.min(item.uniqueRate, 100)}%` }} /></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="report-card compact-card">
                            <div className="section-title-row compact-header"><h2>Media numérica</h2><span className="report-tag">Promedio</span></div>
                            <div className="chart-list compact-list">
                                {summary?.numericStats.map((stat) => {
                                    const relativeWidth = stat.range === 0 ? 50 : Math.max(8, ((stat.average - stat.min) / stat.range) * 100);
                                    return (
                                        <div className="chart-row" key={stat.header}>
                                            <div className="chart-meta">
                                                <span>{stat.header}</span>
                                                <strong>{stat.average.toFixed(2)}</strong>
                                            </div>
                                            <div className="mini-bar mini-bar-accent"><span style={{ width: `${relativeWidth}%` }} /></div>
                                            <small>{stat.min.toFixed(2)} - {stat.max.toFixed(2)}</small>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="report-card compact-card">
                            <div className="section-title-row compact-header"><h2>Rango</h2><span className="report-tag">Spread</span></div>
                            <div className="chart-list compact-list">
                                {summary?.numericStats.map((stat) => {
                                    const width = stat.range === 0 ? 50 : Math.min(100, (stat.range / Math.max(Math.abs(stat.max), 1)) * 100);
                                    return (
                                        <div className="chart-row" key={`${stat.header}-range`}>
                                            <div className="chart-meta">
                                                <span>{stat.header}</span>
                                                <strong>{stat.range.toFixed(2)}</strong>
                                            </div>
                                            <div className="mini-bar mini-bar-warm"><span style={{ width: `${width}%` }} /></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <section className="report-section">
                        <div className="section-title-row"><h2>Perfil de columnas</h2><span className="report-tag">Reporte generado</span></div>
                        <div className="report-card report-table-card"><table className="report-table"><thead><tr><th>Columna</th><th>Tipo</th><th>Completos</th><th>Únicos</th><th>Promedio</th></tr></thead><tbody>{summary?.profiles.map((profile) => <tr key={profile.header}><td><strong>{profile.header}</strong></td><td>{profile.type}</td><td>{profile.filled}</td><td>{profile.unique}</td><td>{profile.average === null ? '-' : profile.average.toFixed(2)}</td></tr>)}</tbody></table></div>
                    </section>
                    <section className="report-section report-grid">
                        <div className="report-card"><h2>Valores vacíos por columna</h2><ul>{summary?.missingByColumn.map((item) => <li key={item.header}><strong>{item.header}:</strong> {item.missing}</li>)}</ul></div>
                        <div className="report-card"><h2>Vista previa</h2><div className="table-wrap report-preview"><table><thead><tr>{uploaded.headers.slice(0, 4).map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{uploaded.rows.slice(0, 5).map((row, index) => <tr key={index}>{uploaded.headers.slice(0, 4).map((header) => <td key={header}>{row[header] || '-'}</td>)}</tr>)}</tbody></table></div></div>
                    </section>
                </div>
            )}
        </div>
    );
}

export default Report;
