import { useMemo, useState } from 'react';
import './Dashboard.css';
import { loadUploadedCsv, type ParsedCsv } from '../services/csvStorage';

const normalize = (value: string) => value.replace(/[$%\s]/g, '').replace(/,/g, '');
const isNumeric = (value: string) => value.trim() !== '' && !Number.isNaN(Number(normalize(value)));

type ColumnProfile = {
    header: string;
    type: 'Numérica' | 'Texto';
    filled: number;
    unique: number;
    average: number | null;
};

function Report() {
    const [uploaded] = useState<ParsedCsv | null>(() => loadUploadedCsv());

    const summary = useMemo(() => {
        if (!uploaded) return null;
        const numericColumns = uploaded.headers.filter((header) => uploaded.rows.some((row) => isNumeric(row[header] ?? '')));
        const missingByColumn = uploaded.headers.map((header) => ({
            header,
            missing: uploaded.rows.filter((row) => !row[header]).length,
        }));
        const profiles: ColumnProfile[] = uploaded.headers.map((header) => {
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
        return {
            rows: uploaded.rows.length,
            columns: uploaded.headers.length,
            missing: missingByColumn.reduce((total, item) => total + item.missing, 0),
            numericColumns,
            missingByColumn,
            profiles,
            completeRows,
        };
    }, [uploaded]);

    const downloadReport = () => {
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

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div><p className="eyebrow">Análisis del archivo</p><h1>Reporte</h1></div>
                {uploaded && <button className="secondary-button" type="button" onClick={downloadReport}>Descargar Reporte</button>}
            </div>
            {!uploaded ? <div className="empty-state"><h2>Primero sube un archivo CSV</h2><p>Regresa al Dashboard para cargar los datos del reporte.</p></div> : (
                <>
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
                    <section className="report-section">
                        <div className="section-title-row"><h2>Perfil de columnas</h2><span className="report-tag">Reporte generado</span></div>
                        <div className="report-card report-table-card"><table className="report-table"><thead><tr><th>Columna</th><th>Tipo</th><th>Completos</th><th>Únicos</th><th>Promedio</th></tr></thead><tbody>{summary?.profiles.map((profile) => <tr key={profile.header}><td><strong>{profile.header}</strong></td><td>{profile.type}</td><td>{profile.filled}</td><td>{profile.unique}</td><td>{profile.average === null ? '-' : profile.average.toFixed(2)}</td></tr>)}</tbody></table></div>
                    </section>
                    <section className="report-section report-grid">
                        <div className="report-card"><h2>Valores vacíos por columna</h2><ul>{summary?.missingByColumn.map((item) => <li key={item.header}><strong>{item.header}:</strong> {item.missing}</li>)}</ul></div>
                        <div className="report-card"><h2>Vista previa</h2><div className="table-wrap report-preview"><table><thead><tr>{uploaded.headers.slice(0, 4).map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{uploaded.rows.slice(0, 3).map((row, index) => <tr key={index}>{uploaded.headers.slice(0, 4).map((header) => <td key={header}>{row[header] || '-'}</td>)}</tr>)}</tbody></table></div></div>
                    </section>
                </>
            )}
        </div>
    );
}

export default Report;
