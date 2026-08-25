import { useState } from 'react';
import type { ChangeEvent } from 'react';
import './Dashboard.css';
import { CSV_PREVIEW_LIMIT, addCsvToDocumentation, addPdfToDocumentation, loadDocumentationCsv, parseCsvText, removeCsvFromDocumentation, type DocumentationCsvEntry, type ParsedCsv } from '../services/csvStorage';

type DocumentationFile = {
    id: string;
    fileName: string;
    size: number;
    type: 'csv' | 'pdf';
    previewUrl?: string;
    csv?: ParsedCsv;
};

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / (1024 ** index);
    return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
};

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
});

function Documentation() {
    const [files, setFiles] = useState<DocumentationFile[]>(() => loadDocumentationCsv().map((entry: DocumentationCsvEntry) => ({
        id: entry.id,
        fileName: entry.fileName,
        size: entry.size,
        type: entry.type ?? (entry.csv ? 'csv' : 'pdf'),
        previewUrl: entry.dataUrl,
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
        let previewUrl = '';

        try {
            previewUrl = await readFileAsDataUrl(file);
        } catch {
            setError('No se pudo leer el archivo seleccionado.');
            return;
        }

        if (isCsv) {
            const parsed = parseCsvText(await file.text());
            if (!parsed.headers.length) {
                setError('El CSV no contiene una cabecera válida.');
                return;
            }
            csv = { fileName: file.name, headers: parsed.headers, rows: parsed.rows, totalRows: parsed.rows.length };
        }

        const documentationEntry = isCsv && csv
            ? addCsvToDocumentation(csv, file.size, previewUrl)
            : addPdfToDocumentation(file.name, file.size, previewUrl);

        const id = documentationEntry.id;
        const nextFile: DocumentationFile = {
            id,
            fileName: file.name,
            size: file.size,
            type: isCsv ? 'csv' : 'pdf',
            previewUrl,
            csv,
        };
        setFiles((current) => [...current, nextFile]);
        setSelectedId(id);
        setError('');
    };

    const totalSize = files.reduce((sum, item) => sum + item.size, 0);
    const pdfCount = files.filter((item) => item.type === 'pdf').length;
    const csvCount = files.filter((item) => item.type === 'csv').length;
    const totalFiles = files.length;
    const pdfPercentage = totalFiles ? (pdfCount / totalFiles) * 100 : 0;
    const csvPercentage = totalFiles ? (csvCount / totalFiles) * 100 : 0;
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
                <div className="documentation-summary-grid">
                    <div className="documentation-summary-card accent">
                        <span>Registros</span>
                        <strong>{totalFiles}</strong>
                    </div>
                    <div className="documentation-summary-card">
                        <span>Tamaño total</span>
                        <strong>{formatBytes(totalSize)}</strong>
                    </div>
                    <div className="documentation-summary-card">
                        <span>PDF</span>
                        <strong>{pdfPercentage.toFixed(0)}%</strong>
                    </div>
                    <div className="documentation-summary-card">
                        <span>CSV</span>
                        <strong>{csvPercentage.toFixed(0)}%</strong>
                    </div>
                </div>

                <div className="documentation-list">
                    <div className="section-title-row"><h2>Archivos insertados</h2><span className="report-tag">{files.length}</span></div>
                    {files.length === 0 ? (
                        <div className="empty-state"><div className="empty-icon">📁</div><h2>Aún no hay documentos</h2><p>Inserta un PDF o CSV para verlo aquí.</p></div>
                    ) : files.map((item) => (
                        <article className={`documentation-item ${item.id === selectedId ? 'selected' : ''}`} key={item.id}>
                            <button type="button" onClick={() => setSelectedId(item.id)}>
                                <span className="file-type">{item.type.toUpperCase()}</span>
                                <strong>{item.fileName}</strong>
                                <small>{formatBytes(item.size)} · Registro {files.findIndex((file) => file.id === item.id) + 1}</small>
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