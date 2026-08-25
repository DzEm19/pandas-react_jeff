import { useState } from 'react';
import './Dashboard.css';
import { clearCsvHistory, loadCsvHistory, type CsvHistoryEntry } from '../services/csvStorage';

// Convierte la fecha ISO producida por csvStorage en un formato local legible.
const formatDate = (value: string) => new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
}).format(new Date(value));

function CsvFiles() {
    // Esta vista consume solo los metadatos persistidos en localStorage; no
    // necesita conservar ni volver a procesar el contenido de cada CSV.
    const [history, setHistory] = useState<CsvHistoryEntry[]>(() => loadCsvHistory());

    const handleClearHistory = () => {
        if (!window.confirm('¿Quieres borrar todos los registros CSV?')) {
            return;
        }

        clearCsvHistory();
        setHistory([]);
    };

    return (
        // Contenedor que reutiliza la estructura visual del area administrativa.
        <div className="dash-page">
            <div className="dash-top">
                <div>
                    <p className="eyebrow">Control de datos</p>
                    <h1>Archivos CSV</h1>
                </div>
                <div className="csv-history-actions">
                    <span className="report-tag">{history.length} archivos registrados</span>
                    {history.length > 0 && (
                        <button className="danger-button" type="button" onClick={handleClearHistory}>
                            Borrar registros
                        </button>
                    )}
                </div>
            </div>

            <div className="dash-upload-status">
                El archivo activo se reinicia al cerrar esta pestaña. Este historial permanece guardado.
            </div>

            {/* Cambia entre estado vacio y tabla segun los metadatos disponibles. */}
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