import { NavLink, Outlet } from 'react-router-dom';

function DashboardLayout() {
    // Layout comun del area /admin: conserva la navegacion lateral y renderiza
    // la pagina hija seleccionada por React Router dentro de Outlet.
    return (
        <div className="dash-layout">
            {/* Navegacion interna; NavLink marca automaticamente la ruta activa. */}
            <aside className="dash-sidebar">
                <h2>TurismoApp</h2>
                <NavLink to="/admin" end>Dashboard</NavLink>
                <NavLink to="/admin/archivos">Archivos CSV</NavLink>
                <NavLink to="/admin/documentacion">Documentación</NavLink>
                <NavLink to="/admin/numpy">NumPy</NavLink>
                <NavLink to="/admin/pandas">Pandas</NavLink>
                <NavLink to="/admin/reporte">Reporte</NavLink>
                <NavLink to="/admin/movimiento">Movimiento</NavLink>
                <NavLink to="/admin/audio">Audio</NavLink>
                <NavLink to="/" className="dash-logout">Volver al Inicio</NavLink>
            </aside>
            {/* El contenido cambia sin desmontar la estructura del dashboard. */}
            <div className="dash-main">
                <Outlet />
            </div>
        </div>
    );
}

export default DashboardLayout;
