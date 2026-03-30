# 🖨️ Sistema de Facturación y Administración — JRJ Centro de Copias y Servicios

> Aplicación de escritorio construida con **Electron + React + Vite** para la gestión administrativa y de facturación de JRJ Centro de Copias y Servicios, ubicado en San Fernando de Monte Cristi, República Dominicana.

---

## 📋 Descripción del Proyecto

Este proyecto es un sistema administrativo y de facturación moderno, eficiente y escalable, empaquetado como aplicación de escritorio mediante Electron. Fue diseñado para gestionar los procesos operativos de **"JRJ Centro de Copias y Servicios"**.

### Características Principales

- **📄 Facturación avanzada** — Soporte completo con formato maestro-detalle, generación de PDF y envío por WhatsApp.
- **🔧 Gestión de trabajos** — Registro manual de trabajos, seguimiento de estados y abonos parciales.
- **💰 Control financiero** — Rastreo de pagos parciales, saldos pendientes y reportes de ingresos.
- **📦 Inventario automático** — Control de stock automatizado con alertas de bajo inventario.
- **👥 Gestión de usuarios** — Control de acceso con roles (admin/empleado).
- **📊 Dashboard interactivo** — Visualización de métricas clave del negocio con gráficos.
- **🌙 Tema claro/oscuro** — Soporte completo para modo oscuro con detección automática del sistema.
- **🖥️ Aplicación de escritorio** — Empaquetada con Electron para ejecución nativa en Windows, macOS y Linux.

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Descripción |
|---|---|
| [Electron](https://www.electronjs.org/) | Framework para aplicaciones de escritorio multiplataforma |
| [React](https://react.dev/) v19 | Biblioteca para interfaces de usuario basadas en componentes |
| [Vite](https://vitejs.dev/) v6 | Entorno de desarrollo ultrarrápido y empaquetador |
| [React Router DOM](https://reactrouter.com/) v7 | Enrutamiento y navegación dinámica SPA |
| [Recharts](https://recharts.org/) | Gráficos composables para visualización de datos |
| [Lucide React](https://lucide.dev/) | Iconos vectoriales elegantes |
| [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) | Generación de facturas en formato PDF |
| [Google Fonts (Inter)](https://fonts.google.com/specimen/Inter) | Tipografía principal del proyecto |
| HTML5, CSS3 & JavaScript | Tecnologías web base |

### Herramientas de Diseño

- **DBML / dbdiagram.io** — Modelado visual de la base de datos relacional.
- **Pencil Project** — Prototipado inicial de la interfaz.

---

## 📁 Estructura del Proyecto

```
proyecto_integrador001/
├── electron/                # Proceso principal de Electron
│   ├── main.js              # Ventana principal y ciclo de vida
│   └── preload.js           # Script de preload (puente IPC)
├── src/                     # Código fuente React (renderer)
│   ├── components/          # Componentes reutilizables
│   │   ├── Modal.jsx
│   │   ├── Sidebar.jsx
│   │   └── TopBar.jsx
│   ├── contexts/            # Contextos de React
│   │   └── AuthContext.jsx
│   ├── data/                # Capa de datos (localStorage)
│   │   └── store.js
│   ├── pages/               # Páginas de la aplicación
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   ├── Usuarios.jsx
│   │   ├── Clientes.jsx
│   │   ├── Categorias.jsx
│   │   ├── Items.jsx
│   │   ├── Facturacion.jsx
│   │   ├── Facturas.jsx
│   │   ├── FacturaDetalle.jsx
│   │   ├── Trabajos.jsx
│   │   ├── TrabajoDetalle.jsx
│   │   ├── Reportes.jsx
│   │   └── PerfilUsuario.jsx
│   ├── utils/               # Utilidades
│   │   └── pdfGenerator.js
│   ├── App.jsx              # Componente raíz con enrutamiento
│   ├── main.jsx             # Punto de entrada React
│   └── index.css            # Sistema de diseño completo
├── index.html               # HTML de entrada
├── vite.config.js           # Configuración de Vite + Electron
├── package.json             # Dependencias y scripts
└── README.md                # Este archivo
```

---

## 🚀 Requisitos Previos

- **Node.js** v18 o superior
- **npm** v9 o superior (incluido con Node.js)

---

## ⚡ Instalación y Uso

### 1. Clonar el repositorio

```bash
git clone https://github.com/MalthaelRD04/proyecto_integrador001.git
cd proyecto_integrador001
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Ejecutar en modo desarrollo

```bash
npm run dev
```

> Esto inicia el servidor de Vite y abre automáticamente la ventana de Electron con hot-reload habilitado.

### 4. Compilar para producción

```bash
npm run build:electron
```

> Genera el build de producción y empaqueta la aplicación de escritorio con `electron-builder`.

---

## 🔑 Credenciales de Prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | Administrador |
| `maria` | `maria123` | Empleado |

---

## 📜 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo con Electron y hot-reload |
| `npm run build` | Compila la aplicación React para producción |
| `npm run preview` | Previsualiza el build de producción en el navegador |
| `npm run build:electron` | Compila y empaqueta como aplicación de escritorio |

---

## 📝 Notas Técnicas

- **Almacenamiento de datos**: La aplicación usa `localStorage` como capa de persistencia, simulando una base de datos. Los datos se inicializan con información de ejemplo (`seed data`) al primer uso.
- **Autenticación**: Sistema basado en sesión almacenada en `localStorage`. No requiere backend externo.
- **Enrutamiento**: Usa `HashRouter` de React Router para compatibilidad con Electron (rutas basadas en `#`).
- **PDF**: Generados en el cliente mediante `html2pdf.js`, sin necesidad de servidor.
- **Tema**: Soporta claro, oscuro y detección automática del sistema operativo.

---

## 📄 Licencia

Proyecto académico — Todos los derechos reservados.

---

<p align="center">
  <strong>JRJ Centro de Copias y Servicios</strong><br>
  San Fernando de Monte Cristi, República Dominicana
</p>
