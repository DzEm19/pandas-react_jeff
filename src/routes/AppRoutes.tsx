import { Routes, Route } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';

import Home from '../pages/Home';
import About from '../pages/About';
import Services from '../pages/Services';
import Contact from '../pages/Contact';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Destinos from '../pages/Destinos';
import Reservaciones from '../pages/Reservaciones';

function AppRoutes() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/nosotros" element={<About />} />
                <Route path="/servicios" element={<Services />} />
                <Route path="/contacto" element={<Contact />} />
                <Route path="/login" element={<Login />} />
            </Route>

            <Route path="/admin" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="destinos" element={<Destinos />} />
                <Route path="reservaciones" element={<Reservaciones />} />
            </Route>
        </Routes>
    );
}

export default AppRoutes;
