import { useState } from 'react';
import type { ChangeEvent } from 'react';
import './Dashboard.css';
import { CSV_PREVIEW_LIMIT, addCsvToDocumentation, loadDocumentationCsv, parseCsvText, removeCsvFromDocumentation, type DocumentationCsvEntry, type ParsedCsv } from '../services/csvStorage';

type DocumentationFile = {
    id: string;
    fileName: string;
    size: number;
    previewUrl?: string;
    csv?: ParsedCsv;
};

function Documentation() {
    const [files, setFiles] = useState<DocumentationFile[]>(() => loadDocumentationCsv().map((entry: DocumentationCsvEntry) => ({
        id: entry.id,
        fileName: entry.fileName,
        size: entry.size,
        csv: entry.csv,
    })));
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
        if (!isPdf && !isCsv) {
            setError('Selecciona un archivo PDF o CSV.');
            return;
        }

        let csv: ParsedCsv | undefined;
        if (isCsv) {
            const parsed = parseCsvText(await file.text());
            if (!parsed.headers.length) {
                setError('El CSV no contiene una cabecera válida.');
                return;
            }
            csv = { fileName: file.name, headers: parsed.headers, rows: parsed.rows, totalRows: parsed.rows.length };
        }

        const documentationEntry = csv ? addCsvToDocumentation(csv, file.size) : null;
        const id = documentationEntry?.id ?? `${Date.now()}-${file.name}`;
        const nextFile = { id, fileName: file.name, size: file.size, previewUrl: URL.createObjectURL(file), csv };
        setFiles((current) => [...current, nextFile]);
        setSelectedId(id);
        setError('');
    };

    const selectedFile = files.find(({ id }) => id === selectedId);

    const removeFile = (id: string) => {
        const fileToRemove = files.find((item) => item.id === id);
        if (fileToRemove?.previewUrl) URL.revokeObjectURL(fileToRemove.previewUrl);
        removeCsvFromDocumentation(id);
        setFiles((current) => current.filter((item) => item.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div>
                    <p className="eyebrow">Centro de recursos</p>
                    <h1>Documentación</h1>
                </div>
                <label className="upload-button" htmlFor="documentation-upload">Insertar archivo</label>
                <input id="documentation-upload" type="file" accept=".pdf,.csv,application/pdf,text/csv" onChange={handleFileUpload} hidden />
            </div>

            <div className="dash-upload-status">Añade documentos PDF o CSV y selecciónalos para abrir una vista previa sin salir del dashboard.</div>
            {error && <div className="documentation-error" role="alert">{error}</div>}

            <section className="documentation-library" aria-label="Archivos insertados">
                <div className="documentation-list">
                    <div className="section-title-row"><h2>Archivos insertados</h2><span className="report-tag">{files.length}</span></div>
                    {files.length === 0 ? (
                        <div className="empty-state"><div className="empty-icon">📁</div><h2>Aún no hay documentos</h2><p>Inserta un PDF o CSV para verlo aquí.</p></div>
                    ) : files.map((item) => (
                        <article className={`documentation-item ${item.id === selectedId ? 'selected' : ''}`} key={item.id}>
                            <button type="button" onClick={() => setSelectedId(item.id)}>
                                <span className="file-type">{item.csv ? 'CSV' : 'PDF'}</span>
                                <strong>{item.fileName}</strong>
                                <small>{Math.ceil(item.size / 1024)} KB</small>
                            </button>
                            <button className="remove-document" type="button" onClick={() => removeFile(item.id)} aria-label={`Quitar ${item.fileName}`}>×</button>
                        </article>
                    ))}
                </div>
            </section>

            {selectedFile && (
                <div className="preview-modal-backdrop" role="presentation" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setSelectedId(null);
                }}>
                    <section className="preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title">
                        <header className="preview-modal-header">
                            <div>
                                <span className="eyebrow">Vista previa {selectedFile.csv ? 'CSV' : 'PDF'}</span>
                                <h2 id="preview-title">{selectedFile.fileName}</h2>
                            </div>
                            <button className="preview-close" type="button" onClick={() => setSelectedId(null)} aria-label="Cerrar vista previa">×</button>
                        </header>
                        <div className="preview-modal-content">
                            {selectedFile.csv ? (
                                <div className="table-wrap documentation-table-wrap">
                                    <table><thead><tr>{selectedFile.csv.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>
                                        {selectedFile.csv.rows.slice(0, CSV_PREVIEW_LIMIT).map((row, index) => <tr key={index}>{selectedFile.csv?.headers.map((header) => <td key={header}>{row[header] || '-'}</td>)}</tr>)}
                                    </tbody></table>
                                    <p className="preview-note">Mostrando las primeras {Math.min(CSV_PREVIEW_LIMIT, selectedFile.csv.totalRows ?? selectedFile.csv.rows.length)} filas de {selectedFile.csv.totalRows ?? selectedFile.csv.rows.length}.</p>
                                </div>
                            ) : <iframe className="pdf-preview" src={selectedFile.previewUrl} title={`Vista previa de ${selectedFile.fileName}`} />}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

export default Documentation;