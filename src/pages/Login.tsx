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
          <span style={styles.badgeText}>ACCESO AL ENTORNO</span>
          <h1 style={styles.heroTitle}>
            Comienza a <br /> trabajar con Python
          </h1>
          <p style={styles.heroSubtitle}>
            Accede a tus herramientas de análisis de datos, automatización y aprendizaje con una experiencia visual alineada con la plataforma.
          </p>
        </div>

        <div style={styles.rightSection}>
          <div style={styles.glassFormCard}>
            <h2 style={styles.formTitle}>INICIAR SESIÓN</h2>

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
    borderRadius: '28px',
    overflow: 'hidden',
    backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(29, 78, 216, 0.45)), url(${fondoImagen})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    boxShadow: '0 28px 80px rgba(15, 23, 42, 0.25)',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.75) 0%, rgba(15, 23, 42, 0.4) 45%, rgba(15, 23, 42, 0.1) 100%)',
    zIndex: 1,
  },
  contentWrapper: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: '1180px',
    padding: '3rem 2rem',
    flexWrap: 'wrap',
    gap: '2rem',
  },
  leftSection: {
    flex: '1 1 450px',
    color: '#ffffff',
    textShadow: '0 2px 8px rgba(0,0,0,0.6)',
    maxWidth: '560px',
  },
  badgeText: {
    display: 'inline-block',
    fontSize: '0.82rem',
    letterSpacing: '3px',
    color: '#fbbf24',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 'clamp(2.4rem, 4vw, 4rem)',
    fontWeight: '900',
    lineHeight: '1.08',
    margin: '0.8rem 0 1rem',
    color: '#ffffff',
    letterSpacing: '-0.05em',
  },
  heroSubtitle: {
    fontSize: '1.08rem',
    color: 'rgba(226, 232, 240, 0.95)',
    lineHeight: '1.7',
    maxWidth: '520px',
  },
  rightSection: {
    flex: '0 1 380px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  glassFormCard: {
    width: '100%',
    background: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    padding: '2rem 1.7rem',
    borderRadius: '24px',
    boxShadow: '0 24px 50px rgba(15, 23, 42, 0.35)',
    border: '1px solid rgba(191, 219, 254, 0.22)',
  },
  formTitle: {
    fontSize: '1.15rem',
    fontWeight: '800',
    letterSpacing: '1.6px',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: '1.2rem',
  },
  errorMessage: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    border: '1px solid rgba(239, 68, 68, 0.7)',
    color: '#fecaca',
    padding: '0.7rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
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
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#dbeafe',
    letterSpacing: '0.04em',
  },
  input: {
    padding: '0.9rem 0.95rem',
    borderRadius: '12px',
    border: '1px solid rgba(147, 197, 253, 0.28)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#0f172a',
    fontSize: '0.94rem',
    outline: 'none',
    boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.06)',
  },
  button: {
    marginTop: '0.8rem',
    padding: '0.95rem 1rem',
    borderRadius: '999px',
    border: 'none',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: '#0f172a',
    fontWeight: '800',
    fontSize: '0.9rem',
    letterSpacing: '1px',
    cursor: 'pointer',
    boxShadow: '0 16px 30px rgba(245, 158, 11, 0.35)',
  },
};

export default Login;