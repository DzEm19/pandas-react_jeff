import { NavLink, Outlet } from 'react-router-dom';

function DashboardLayout() {
    return (
        <div className="dash-layout">
            <aside className="dash-sidebar">
                <h2>TurismoApp</h2>
                <NavLink to="/admin" end>Dashboard</NavLink>
                <NavLink to="/admin/archivos">Archivos CSV</NavLink>
                <NavLink to="/admin/numpy">NumPy</NavLink>
                <NavLink to="/admin/pandas">Pandas</NavLink>
                <NavLink to="/admin/reporte">Reporte</NavLink>
                <NavLink to="/" className="dash-logout">Volver al Inicio</NavLink>
            </aside>
            <div className="dash-main">
                <Outlet />
            </div>
        </div>
    );
}

export default DashboardLayout;
