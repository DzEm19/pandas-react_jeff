import { Routes, Route } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';

import Home from '../pages/Home';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import CsvFiles from '../pages/CsvFiles';
import AnalysisSection from '../pages/AnalysisSection';
import Report from '../pages/Report';
import Movement from '../pages/Movement';
import AudioModel from '../pages/AudioModel';
import ImageModel from '../pages/ImageModel';
import Documentation from '../pages/Documentation';

function AppRoutes() {
    // Define dos zonas: paginas publicas con MainLayout y herramientas de
    // analisis bajo /admin, todas agrupadas dentro de DashboardLayout.
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
            </Route>

            {/* El index representa /admin; las rutas hijas comparten sidebar. */}
            <Route path="/admin" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="archivos" element={<CsvFiles />} />
                <Route path="documentacion" element={<Documentation />} />
                <Route path="numpy" element={<AnalysisSection kind="numpy" />} />
                <Route path="pandas" element={<AnalysisSection kind="pandas" />} />
                <Route path="reporte" element={<Report />} />
                <Route path="movimiento" element={<Movement />} />
                <Route path="audio" element={<AudioModel />} />
                <Route path="imagen" element={<ImageModel />} />
            </Route>
        </Routes>
    );
}

export default AppRoutes;
