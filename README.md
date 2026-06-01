# ConstructPrice: Gestor de Precios de Construcción en Tiempo Real

![ConstructPrice Banner](https://img.shields.io/badge/Status-En_Desarrollo-orange?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React_19_|_Vite_|_Socket.io_|_Groq-blue?style=for-the-badge)

**ConstructPrice** es una plataforma SaaS diseñada para constructoras y ferreterías en Colombia que permite gestionar, actualizar y analizar los precios de materiales de construcción en tiempo real, potenciada por Inteligencia Artificial (Groq).

## 🚀 Características Principales

### 1. **Buscador de Precios con IA (Groq + Búsqueda Web)**
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
- **Backend:** Node.js + Express + Socket.io (Puerto 3001). Actúa como proxy seguro hacia Groq (la API Key nunca se expone en el navegador).
- **IA:** Groq API con el modelo `groq/compound` (incluye búsqueda web en tiempo real).
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

### 2. Configurar la API Key de Groq
Tienes **dos opciones** (consigue una clave gratis en https://console.groq.com/keys):

**Opción A — Desde la interfaz (recomendado):** Inicia la app y ve a **Configuración** en el
menú lateral. Pega tu clave y pulsa *Guardar y probar*. Se guarda en tu navegador.

**Opción B — Archivo `.env`:** Crea un archivo `.env` en la raíz (puedes copiar `.env.example`):
```env
GROQ_API_KEY=tu_api_key_de_groq_aqui
```

> Si configuras la clave desde la interfaz, esa tiene prioridad sobre la del `.env`.

### 3. Instalar Dependencias
```bash
# Instalar dependencias del Frontend y Backend
npm install
```

### 4. Iniciar la Aplicación (Modo Desarrollo)
Necesitarás dos terminales:

**Terminal 1: Servidor Backend (WebSockets + API de Groq)**
```bash
npm run server
# Corre en http://localhost:3001
```

**Terminal 2: Frontend (React)**
```bash
npm run dev
# Corre en http://localhost:3000
```

> El frontend pide los precios al backend, y el backend consulta Groq con búsqueda web en vivo.
> Así la API Key de Groq permanece segura en el servidor y no se expone en el navegador.

---

## ☁️ Despliegue en Vercel

El proyecto ya está listo para Vercel. Los endpoints de Groq corren como **funciones
serverless** (carpeta `/api`) y el frontend se sirve como sitio estático.

> **Nota:** Vercel no mantiene conexiones WebSocket persistentes, así que la
> sincronización en tiempo real (Socket.io) solo funciona en local. La búsqueda de
> precios con IA sí funciona perfectamente en Vercel.

### Pasos
1. Sube el repositorio a GitHub (este branch ya lo está).
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repositorio.
   Vercel detecta Vite automáticamente (build `npm run build`, salida `dist`).
3. **(Opcional)** En *Settings → Environment Variables* añade `GROQ_API_KEY` con tu clave.
   Si no la pones, los usuarios pueden ingresarla desde la pantalla **Configuración**.
4. **Deploy**. Cada `git push` al repositorio crea un nuevo despliegue automáticamente.

Endpoints disponibles en producción: `/api/update-price`, `/api/market-report`,
`/api/validate-key`, `/api/health`.

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
