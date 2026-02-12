# ConstructPrice: Gestor de Precios de Construcción en Tiempo Real

![ConstructPrice Banner](https://img.shields.io/badge/Status-En_Desarrollo-orange?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React_19_|_Vite_|_Socket.io_|_Gemini_2.0-blue?style=for-the-badge)

**ConstructPrice** es una plataforma SaaS diseñada para constructoras y ferreterías en Colombia que permite gestionar, actualizar y analizar los precios de materiales de construcción en tiempo real, potenciada por Inteligencia Artificial.

## 🚀 Características Principales

### 1. **Buscador de Precios con IA (Gemini 2.0)**
- **Actualización Automática:** Busca el mejor precio del mercado en tiempo real.
- **Fuentes Locales:** Rastrea Homecenter, Constructor, Easy, y **Ferreterías Locales** (vía Google Search).
- **Evidencia:** Proporciona el link directo al producto encontrado.

### 2. **Sincronización en Tiempo Real (WebSockets)**
- **Colaboración:** Si un usuario actualiza un precio, **todos los demás usuarios lo ven reflejado instantáneamente** sin recargar la página.
- **Backend:** Servidor Node.js con Socket.io para la gestión de eventos.

### 3. **Gestión de Inventario**
- CRUD completo de materiales.
- Clasificación por categorías (Cementos, Aceros, Eléctricos, etc.).
- Historial de tendencias (Sube/Baja/Estable).

### 4. **Análisis de Mercado**
- Dashboard con estadísticas clave.
- Reportes generados por IA sobre la situación del sector construcción (TRM, precios del acero, noticias).

---

## 🛠️ Arquitectura Técnica

El proyecto sigue una arquitectura moderna y escalable:

- **Frontend:** React 19 + Vite + TypeScript + TailwindCSS.
- **Backend:** Node.js + Express + Socket.io (Puerto 3001).
- **IA:** Google Generative AI SDK (Gemini 2.0 Flash Experimental).
- **Base de Datos:** PostgreSQL (Esquema definido en `database/`).
- **Iconos:** Lucide React.
- **Gráficos:** Recharts.

---

## 📦 Instalación y Despliegue Local

Sigue estos pasos para correr el proyecto en tu máquina:

### Prerrequisitos
- Node.js (v18 o superior)
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/constructprice.git
cd constructprice
```

### 2. Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz con tu API Key de Google Gemini:
```env
VITE_GEMINI_API_KEY=tu_api_key_aqui
```

### 3. Instalar Dependencias
```bash
# Instalar dependencias del Frontend y Backend
npm install
```

### 4. Iniciar la Aplicación (Modo Desarrollo)
Necesitarás dos terminales:

**Terminal 1: Servidor Backend (WebSockets)**
```bash
node server/index.js
# Corre en http://localhost:3001
```

**Terminal 2: Frontend (React)**
```bash
npm run dev
# Corre en http://localhost:3002
```

---

## 🗄️ Base de Datos

El esquema SQL para la base de datos (PostgreSQL) se encuentra en:
- `database/schema.sql`: Estructura completa.
- `database/migrations/`: Migraciones para control de versiones (Up/Down).

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir lo que te gustaría cambiar.

---

Desarrollado con ❤️ para el sector construcción en Colombia.
