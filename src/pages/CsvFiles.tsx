import { useEffect, useState } from 'react';
import './Dashboard.css';
import { loadCsvHistory, type CsvHistoryEntry } from '../services/csvStorage';

const formatDate = (value: string) => new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
}).format(new Date(value));

function CsvFiles() {
    const [history, setHistory] = useState<CsvHistoryEntry[]>([]);

    useEffect(() => {
        setHistory(loadCsvHistory());
    }, []);

    return (
        <div className="dash-page">
            <div className="dash-top">
                <div>
                    <p className="eyebrow">Control de datos</p>
                    <h1>Archivos CSV</h1>
                </div>
                <span className="report-tag">{history.length} archivos registrados</span>
            </div>

            <div className="dash-upload-status">
                El archivo activo se reinicia al cerrar esta pestaña. Este historial permanece guardado.
            </div>

            {history.length === 0 ? (
                <div className="empty-state">
                    <h2>Aún no hay archivos registrados</h2>
                    <p>Sube un CSV desde el Dashboard y aparecerá aquí automáticamente.</p>
                </div>
            ) : (
                <div className="dash-card csv-history-card">
                    <table className="dash-table">
                        <thead>
                            <tr><th>Archivo</th><th>Fecha de inserción</th><th>Filas</th><th>Columnas</th></tr>
                        </thead>
                        <tbody>
                            {history.map((file) => (
                                <tr key={file.id}>
                                    <td><strong>{file.fileName}</strong></td>
                                    <td>{formatDate(file.insertedAt)}</td>
                                    <td>{file.rows}</td>
                                    <td>{file.columns}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default CsvFiles;