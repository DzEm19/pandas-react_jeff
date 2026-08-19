import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fondoImagen from '../assets/fondo-montana.jpg';

const Login: React.FC = () => {
 const [email, setEmail] = useState('');
const [password, setPassword] = useState(''); 
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (email === 'admin@empresa.com' && password === '123456') {
    // 1. Guarda la sesión activa
    localStorage.setItem('isAuthenticated', 'true');
    
    // 2. Redirige a la ruta principal del Dashboard (/admin)
    navigate('/admin');
  } else {
    setError('Credenciales incorrectas.');
  
};
  };

  return (
    <div style={styles.heroContainer}>
      <div style={styles.overlay}></div>

      <div style={styles.contentWrapper}>
        <div style={styles.leftSection}>
          <span style={styles.badgeText}>EXPLORA EL MUNDO</span>
          <h1 style={styles.heroTitle}>
            MÁS DE 10 AÑOS <br /> DE EXPERIENCIA
          </h1>
          <p style={styles.heroSubtitle}>
            Porque sabemos muy bien el servicio que mereces.
          </p>
        </div>

        <div style={styles.rightSection}>
          <div style={styles.glassFormCard}>
            <h2 style={styles.formTitle}>INICIAR SESIÓN</h2>

            {/* Mensaje de error en caso de fallo */}
            {error && <div style={styles.errorMessage}>{error}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="admin@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Contraseña</label>
                <input
                  type="password"
                  placeholder="123456"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <button type="submit" style={styles.button}>
                INGRESAR
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  heroContainer: {
    position: 'relative',
    minHeight: '85vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundImage: `url(${fondoImagen})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 25, 45, 0.35)',
    zIndex: 1,
  },
  contentWrapper: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: '1100px',
    padding: '3rem 2rem',
    flexWrap: 'wrap',
    gap: '2rem',
  },
  leftSection: {
    flex: '1 1 450px',
    color: '#ffffff',
    textShadow: '0 2px 8px rgba(0,0,0,0.6)',
  },
  badgeText: {
    fontSize: '0.85rem',
    letterSpacing: '3px',
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  heroTitle: {
  fontSize: '2.5rem',
  fontWeight: '900',
  lineHeight: '1.2',
  margin: '0.8rem 0',
  color: '#ffffff',
  textTransform: 'uppercase', 

  },
  heroSubtitle: {
    fontSize: '1rem',
    color: '#f1f5f9',
  },
  rightSection: {
    flex: '0 1 360px',
    width: '100%',
  },
  glassFormCard: {
    backgroundColor: 'rgba(11, 19, 32, 0.65)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 20px 30px rgba(0, 0, 0, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  formTitle: {
    fontSize: '1.1rem',
    fontWeight: '800',
    letterSpacing: '1.5px',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: '1.2rem',
  },
  errorMessage: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.6)',
    color: '#fca5a5',
    padding: '0.6rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#cbd5e1',
  },
  input: {
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    color: '#0f172a',
    fontSize: '0.9rem',
    outline: 'none',
  },
  button: {
    marginTop: '0.8rem',
    padding: '0.85rem',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#ff6b2b',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    letterSpacing: '1px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(255, 107, 43, 0.4)',
  },
};

export default Login;