import { NavLink } from 'react-router-dom';

function Navbar() {
    return (
        <header className="navbar">
            <div className="container navbar-content">
                <h1 className="logo">PythonLab</h1>
                <nav>
                    <NavLink to="/">Inicio</NavLink>
                    <NavLink to="/login">Login</NavLink>
                </nav>
            </div>
        </header>
    );
}

export default Navbar;
