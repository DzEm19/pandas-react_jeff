import { useEffect, useState } from 'react';
import './Dashboard.css';
import { loadUploadedCsv, readCsvFromFile } from '../services/csvStorage';

function Destinos() {
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

    const destinos = [
        { nombre: 'Cancún', ubicacion: 'México', categoria: 'Playa', precio: '$1,200', estado: 'Activo' },
        { nombre: 'Machu Picchu', ubicacion: 'Perú', categoria: 'Cultural', precio: '$1,800', estado: 'Activo' },
        { nombre: 'París', ubicacion: 'Francia', categoria: 'Romántico', precio: '$2,500', estado: 'Activo' },
        { nombre: 'Tokio', ubicacion: 'Japón', categoria: 'Urbano', precio: '$3,200', estado: 'Activo' },
        { nombre: 'Santorini', ubicacion: 'Grecia', categoria: 'Playa', precio: '$2,100', estado: 'Inactivo' },
    ];

    return (
        <div className="dash-page">
            <div className="dash-top">
                <h2>Destinos</h2>
                <div className="action-row">
                    <label className="upload-button" htmlFor="destinos-csv-upload">
                        Importar CSV
                    </label>
                    <input
                        id="destinos-csv-upload"
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
                            <th>Nombre</th>
                            <th>Ubicación</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {destinos.map((d, i) => (
                            <tr key={i}>
                                <td>{d.nombre}</td>
                                <td>{d.ubicacion}</td>
                                <td>{d.categoria}</td>
                                <td>{d.precio}</td>
                                <td><span className={`badge ${d.estado.toLowerCase()}`}>{d.estado}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Destinos;
