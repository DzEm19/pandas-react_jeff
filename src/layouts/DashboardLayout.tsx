import { NavLink, Outlet } from 'react-router-dom';

function DashboardLayout() {
    return (
        <div className="dash-layout">
            <aside className="dash-sidebar">
                <h2>TurismoApp</h2>
                <NavLink to="/admin" end>Dashboard</NavLink>
                <NavLink to="/admin/destinos">Destinos</NavLink>
                <NavLink to="/admin/reservaciones">Reservaciones</NavLink>
                <NavLink to="/" className="dash-logout">Volver al Inicio</NavLink>
            </aside>
            <div className="dash-main">
                <Outlet />
            </div>
        </div>
    );
}

export default DashboardLayout;
