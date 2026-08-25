import { Routes, Route } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';

import Home from '../pages/Home';
import About from '../pages/About';
import Services from '../pages/Services';
import Contact from '../pages/Contact';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import CsvFiles from '../pages/CsvFiles';
import AnalysisSection from '../pages/AnalysisSection';
import Report from '../pages/Report';
import AudioModel from '../pages/AudioModel';

function AppRoutes() {
    // Define dos zonas: paginas publicas con MainLayout y herramientas de
    // analisis bajo /admin, todas agrupadas dentro de DashboardLayout.
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/nosotros" element={<About />} />
                <Route path="/servicios" element={<Services />} />
                <Route path="/contacto" element={<Contact />} />
                <Route path="/login" element={<Login />} />
            </Route>

            {/* El index representa /admin; las rutas hijas comparten sidebar. */}
            <Route path="/admin" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="archivos" element={<CsvFiles />} />
                <Route path="numpy" element={<AnalysisSection kind="numpy" />} />
                <Route path="pandas" element={<AnalysisSection kind="pandas" />} />
                <Route path="reporte" element={<Report />} />
                <Route path="audio" element={<AudioModel />} />
            </Route>
        </Routes>
    );
}

export default AppRoutes;
