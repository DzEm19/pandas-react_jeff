import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPython, FaCode, FaChartLine, FaDatabase, FaBook, FaRocket } from 'react-icons/fa';

function Home() {
  // Datos estáticos de Python
  const pythonConcepts = [
    {
      id: 'variables',
      title: 'Variables y Tipos de Datos',
      description: 'Python es un lenguaje de tipado dinámico. Las variables pueden cambiar de tipo durante la ejecución.',
      codeExample: `# Variables en Python
nombre = "Ana"  # String
edad = 25       # Integer
altura = 1.75   # Float
es_estudiante = True  # Boolean

# Tipado dinámico
variable = 10
print(type(variable))  # <class 'int'>
variable = "ahora soy string"
print(type(variable))  # <class 'str'>`,
      output: `<class 'int'>
<class 'str'>`,
      difficulty: 'beginner',
      category: 'basics'
    },
    {
      id: 'listas',
      title: 'Listas y Tuplas',
      description: 'Las listas son mutables y las tuplas son inmutables. Ambas pueden contener diferentes tipos de datos.',
      codeExample: `# Listas - mutables
frutas = ["manzana", "banana", "naranja"]
frutas.append("uva")
frutas[0] = "pera"
print(frutas)  # ['pera', 'banana', 'naranja', 'uva']

# Tuplas - inmutables
coordenadas = (10, 20)
# coordenadas[0] = 30  # Esto daría error

# Listas de comprensión
cuadrados = [x**2 for x in range(5)]
print(cuadrados)  # [0, 1, 4, 9, 16]`,
      output: `['pera', 'banana', 'naranja', 'uva']
[0, 1, 4, 9, 16]`,
      difficulty: 'beginner',
      category: 'data-structures'
    },
    {
      id: 'funciones',
      title: 'Funciones y Lambdas',
      description: 'Las funciones en Python son ciudadanos de primera clase. Pueden ser asignadas a variables y pasadas como argumentos.',
      codeExample: `# Función tradicional
def saludar(nombre, saludo="Hola"):
    return f"{saludo}, {nombre}!"

print(saludar("Carlos"))  # Hola, Carlos!
print(saludar("Maria", "Buenos días"))  # Buenos días, Maria!

# Función lambda (anonima)
cuadrado = lambda x: x ** 2
print(cuadrado(5))  # 25

# Argumentos variables
def sumar_todos(*args):
    return sum(args)

print(sumar_todos(1, 2, 3, 4))  # 10

# Argumentos con nombre
def datos_persona(**kwargs):
    return f"{kwargs.get('nombre', 'Anonimo')} - {kwargs.get('edad', '?')} años"

print(datos_persona(nombre="Luis", edad=30))  # Luis - 30 años`,
      output: `Hola, Carlos!
Buenos días, Maria!
25
10
Luis - 30 años`,
      difficulty: 'intermediate',
      category: 'functions'
    },
    {
      id: 'clases',
      title: 'Clases y Programación Orientada a Objetos',
      description: 'Python soporta POO con clases, herencia y polimorfismo. Todo en Python es un objeto.',
      codeExample: `class Animal:
    def __init__(self, nombre, edad):
        self.nombre = nombre
        self.edad = edad
    
    def hacer_sonido(self):
        return "Sonido genérico"

class Perro(Animal):
    def hacer_sonido(self):
        return f"{self.nombre} dice: ¡Guau!"
    
    def correr(self):
        return f"{self.nombre} está corriendo"

class Gato(Animal):
    def hacer_sonido(self):
        return f"{self.nombre} dice: ¡Miau!"
    
    def trepar(self):
        return f"{self.nombre} está trepando"

# Uso
perro = Perro("Rex", 3)
gato = Gato("Michi", 2)

print(perro.hacer_sonido())  # Rex dice: ¡Guau!
print(gato.hacer_sonido())   # Michi dice: ¡Miau!
print(perro.correr())        # Rex está corriendo
print(gato.trepar())         # Michi está trepando`,
      output: `Rex dice: ¡Guau!
Michi dice: ¡Miau!
Rex está corriendo
Michi está trepando`,
      difficulty: 'intermediate',
      category: 'oop'
    },
    {
      id: 'pandas',
      title: 'Pandas - Análisis de Datos',
      description: 'Pandas es la biblioteca principal para análisis de datos en Python. Proporciona estructuras de datos potentes.',
      codeExample: `import pandas as pd
import numpy as np

# Crear un DataFrame
data = {
    'Nombre': ['Ana', 'Luis', 'Maria', 'Carlos'],
    'Edad': [25, 30, 28, 35],
    'Ciudad': ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'],
    'Salario': [30000, 45000, 38000, 52000]
}

df = pd.DataFrame(data)
print("DataFrame creado:")
print(df)

# Operaciones básicas
print("\\nMedia de edad:", df['Edad'].mean())
print("Salario máximo:", df['Salario'].max())

# Filtrar datos
jovenes = df[df['Edad'] < 30]
print("\\nPersonas menores de 30:")
print(jovenes)

# Agrupar por ciudad
por_ciudad = df.groupby('Ciudad')['Salario'].mean()
print("\\nSalario promedio por ciudad:")
print(por_ciudad)`,
      output: `DataFrame creado:
  Nombre  Edad    Ciudad  Salario
0    Ana    25    Madrid    30000
1   Luis    30  Barcelona    45000
2  Maria    28   Valencia    38000
3 Carlos    35    Sevilla    52000

Media de edad: 29.5
Salario máximo: 52000

Personas menores de 30:
  Nombre  Edad  Ciudad  Salario
0    Ana    25  Madrid    30000
2  Maria    28 Valencia    38000

Salario promedio por ciudad:
Ciudad
Barcelona    45000.0
Madrid       30000.0
Sevilla      52000.0
Valencia     38000.0
Name: Salario, dtype: float64`,
      difficulty: 'advanced',
      category: 'modules'
    }
  ];

  // Componente PythonCard embebido
  const PythonCard = ({ concept }: { concept: any }) => {
    const [expanded, setExpanded] = useState(false);
    
    const difficultyColors: Record<string, string> = {
      beginner: '#4CAF50',
      intermediate: '#FF9800',
      advanced: '#f44336'
    };

    const difficultyLabels: Record<string, string> = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado'
    };

    return (
      <motion.div 
        className="python-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -4 }}
      >
        <div className="card-header" onClick={() => setExpanded(!expanded)}>
          <div className="card-title-section">
            <h3>{concept.title}</h3>
            <span 
              className="difficulty-badge"
              style={{ backgroundColor: difficultyColors[concept.difficulty] }}
            >
              {difficultyLabels[concept.difficulty]}
            </span>
          </div>
          <div className="card-actions">
            <span className="category-tag">{concept.category}</span>
            <button className="expand-button">
              {expanded ? '▲' : '▼'}
            </button>
          </div>
        </div>
        
        {expanded && (
          <motion.div 
            className="card-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="description">{concept.description}</p>
            
            <div className="code-section">
              <div className="code-header">
                <span>Código de ejemplo</span>
              </div>
              <pre className="code-block">
                <code>{concept.codeExample}</code>
              </pre>
            </div>
            
            {concept.output && (
              <div className="output-section">
                <div className="output-header">Salida:</div>
                <pre className="output-block">
                  <code>{concept.output}</code>
                </pre>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="home-page">
      {/* Sección Hero */}
      <section className="hero-section">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <FaPython className="python-logo" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Aprende Python
          </motion.h1>
          
          <motion.p 
            className="subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Domina Python desde lo básico hasta el análisis de datos con Pandas
          </motion.p>

          <motion.div 
            className="hero-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <a href="#concepts" className="btn-primary">
              Ver Conceptos
            </a>
            <a href="#features" className="btn-secondary">
              Características
            </a>
          </motion.div>

          <motion.div 
            className="stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <motion.div 
              className="stat"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <span className="number">{pythonConcepts.length}</span>
              <span className="label">Conceptos</span>
            </motion.div>
            <motion.div 
              className="stat"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <span className="number">5</span>
              <span className="label">Categorías</span>
            </motion.div>
            <motion.div 
              className="stat"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <span className="number">100%</span>
              <span className="label">Gratuito</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Sección de Introducción */}
      <section className="intro-section">
        <motion.div 
          className="intro-content"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>¿Por qué aprender Python?</h2>
          <div className="intro-grid">
            <div className="intro-card">
              <FaRocket className="intro-icon" />
              <h3>Fácil de aprender</h3>
              <p>Sintaxis clara y legible, perfecta para principiantes</p>
            </div>
            <div className="intro-card">
              <FaCode className="intro-icon" />
              <h3>Versátil</h3>
              <p>Web, datos, IA, automatización y más</p>
            </div>
            <div className="intro-card">
              <FaChartLine className="intro-icon" />
              <h3>Demanda laboral</h3>
              <p>Uno de los lenguajes más solicitados</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Sección de Conceptos */}
      <section id="concepts" className="concepts-section">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Conceptos de Python
        </motion.h2>
        
        <motion.p 
          className="concepts-subtitle"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Haz clic en cada tarjeta para ver ejemplos de código
        </motion.p>

        <div className="concepts-grid">
          {pythonConcepts.map((concept, index) => (
            <motion.div
              key={concept.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <PythonCard concept={concept} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sección de Features */}
      <section id="features" className="features-section">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          ¿Qué aprenderás?
        </motion.h2>

        <div className="features-grid">
          <motion.div 
            className="feature-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            whileHover={{ 
              y: -8,
              boxShadow: "0 12px 20px rgba(0,0,0,0.15)"
            }}
          >
            <FaCode className="feature-icon" />
            <h3>Sintaxis Básica</h3>
            <p>Variables, tipos de datos, operadores y estructuras de control</p>
            <span className="feature-tag">Fundamentos</span>
          </motion.div>

          <motion.div 
            className="feature-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            whileHover={{ 
              y: -8,
              boxShadow: "0 12px 20px rgba(0,0,0,0.15)"
            }}
          >
            <FaDatabase className="feature-icon" />
            <h3>Estructuras de Datos</h3>
            <p>Listas, tuplas, diccionarios y conjuntos</p>
            <span className="feature-tag">Colecciones</span>
          </motion.div>

          <motion.div 
            className="feature-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            whileHover={{ 
              y: -8,
              boxShadow: "0 12px 20px rgba(0,0,0,0.15)"
            }}
          >
            <FaBook className="feature-icon" />
            <h3>Funciones y POO</h3>
            <p>Funciones, lambdas, clases, herencia y polimorfismo</p>
            <span className="feature-tag">Avanzado</span>
          </motion.div>

          <motion.div 
            className="feature-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            whileHover={{ 
              y: -8,
              boxShadow: "0 12px 20px rgba(0,0,0,0.15)"
            }}
          >
            <FaChartLine className="feature-icon" />
            <h3>Pandas</h3>
            <p>Análisis y manipulación de datos con Pandas y NumPy</p>
            <span className="feature-tag">Data Science</span>
          </motion.div>
        </div>
      </section>

      {/* Sección CTA */}
      <section className="cta-section">
        <motion.div 
          className="cta-content"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>¿Listo para comenzar?</h2>
          <p>Explora todos los conceptos y comienza tu viaje en Python hoy</p>
          <motion.a 
            href="#concepts" 
            className="cta-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Empezar Ahora
          </motion.a>
        </motion.div>
      </section>
    </div>
  );
}

export default Home;