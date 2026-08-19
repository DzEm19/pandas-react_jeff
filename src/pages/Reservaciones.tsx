import { useEffect, useState } from 'react';
import './Dashboard.css';
import { loadUploadedCsv, readCsvFromFile } from '../services/csvStorage';

function Reservaciones() {
    const [uploadedFile, setUploadedFile] = useState<string | null>(null);

    useEffect(() => {
        const saved = loadUploadedCsv();
        setUploadedFile(saved?.fileName ?? null);
    }, []);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        const parsed = await readCsvFromFile(file);
        if (parsed) {
            setUploadedFile(parsed.fileName);
        }
    };

    const reservas = [
        { id: '001', cliente: 'María García', destino: 'Cancún', fecha: '2026-08-20', total: '$2,400', estado: 'Confirmada' },
        { id: '002', cliente: 'Carlos López', destino: 'Machu Picchu', fecha: '2026-08-22', total: '$5,400', estado: 'Pendiente' },
        { id: '003', cliente: 'Ana Martínez', destino: 'París', fecha: '2026-08-25', total: '$5,000', estado: 'Confirmada' },
        { id: '004', cliente: 'Pedro Sánchez', destino: 'Tokio', fecha: '2026-08-28', total: '$3,200', estado: 'Cancelada' },
        { id: '005', cliente: 'Laura Rodríguez', destino: 'Santorini', fecha: '2026-09-01', total: '$4,200', estado: 'Pendiente' },
    ];

    return (
        <div className="dash-page">
            <div className="dash-top">
                <h2>Reservaciones</h2>
                <div className="action-row">
                    <label className="upload-button" htmlFor="reservas-csv-upload">
                        Importar CSV
                    </label>
                    <input
                        id="reservas-csv-upload"
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleFileUpload}
                        hidden
                    />
                </div>
            </div>

            {uploadedFile && (
                <div className="dash-upload-status">CSV cargado: {uploadedFile}</div>
            )}

            <div className="dash-card">
                <table className="dash-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Cliente</th>
                            <th>Destino</th>
                            <th>Fecha</th>
                            <th>Total</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservas.map((r) => (
                            <tr key={r.id}>
                                <td>{r.id}</td>
                                <td>{r.cliente}</td>
                                <td>{r.destino}</td>
                                <td>{r.fecha}</td>
                                <td>{r.total}</td>
                                <td><span className={`badge ${r.estado.toLowerCase()}`}>{r.estado}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Reservaciones;
