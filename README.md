# 🖨️ Sistema de Facturación y Administración — JRJ Centro de Copias y Servicios

> Aplicación de escritorio multiplataforma construida con **Tauri + React + Vite** para la gestión administrativa y de facturación de JRJ Centro de Copias y Servicios, ubicado en San Fernando de Monte Cristi, República Dominicana.

---

## 📋 Descripción del Proyecto

Este proyecto es un sistema administrativo y de facturación moderno, eficiente y escalable, empaquetado como aplicación de escritorio mediante **Tauri** (migrado previamente desde Electron para mayor eficiencia y menor consumo de recursos). Fue diseñado para gestionar los procesos operativos de **"JRJ Centro de Copias y Servicios"**.

### Características Principales

- **📄 Facturación Avanzada** — Soporte completo con formato maestro-detalle, generación de PDF, envío por WhatsApp e impresión directa.
- **🔧 Gestión de Trabajos** — Registro manual de trabajos y seguimientos de estados (pendiente, en proceso, entregado, cancelado) y abonos parciales.
- **💰 Control Financiero** — Rastreo de pagos parciales, saldos pendientes y reportes detallados.
- **📦 Inventario Automático** — Control de stock integrado con el módulo de facturación y alertas de bajo inventario.
- **👥 Gestión de Usuarios** — Control de acceso (admin / empleado) e inicio de sesión.
- **📊 Dashboard Interactivo** — Visualización de métricas clave del negocio, ventas diarias y mensuales, acompañadas por gráficos.
- **🌙 Modo Claro/Oscuro** — Soporte completo de temas con detección automática de las preferencias del sistema.
- **💾 Base de Datos Local** — Todo ocurre `offline` mediante una base de datos SQLite integrada de forma nativa.
- **⚡ Alto Rendimiento y Ligereza** — Funciona usando el motor WebView2 nativo y un backend en Rust gracias a `Tauri`, siendo significativamente más rápido que dependencias pasadas de Chromium empacado.

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Descripción |
|---|---|
| [Tauri](https://tauri.app/) v2 | Backend y contenedor nativo multiplataforma en Rust |
| [Rust](https://www.rust-lang.org/) | Gestión de componentes base en el Backend local |
| [SQLite](https://www.sqlite.org/) | Base de datos local transaccional rápida usando `@tauri-apps/plugin-sql` |
| [React](https://react.dev/) v19 | Biblioteca para interfaces de usuario modulares |
| [Vite](https://vitejs.dev/) v6 | Entorno de desarrollo ultrarrápido y empaquetador eficiente |
| [React Router DOM](https://reactrouter.com/) v7 | Enrutamiento dinámico para SPA |
| [Recharts](https://recharts.org/) | Gráficos composables para reportes y visualización |
| [Lucide React](https://lucide.dev/) | Iconos vectoriales elegantes |
| [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) | Generador de comprobantes y facturas en PDF |

---

## 📁 Estructura del Proyecto

```
proyecto_integrador001/
├── src-tauri/               # Backend en Rust configurado por Tauri
│   ├── src/                 # Código fuente principal en Rust (main.rs)
│   ├── Cargo.toml           # Dependencias nativas
│   └── tauri.conf.json      # Configuración de Tauri (plugins, ventanas)
├── src/                     # Código fuente Frontend (React + Vite)
│   ├── components/          # Componentes UI reutilizables
│   ├── contexts/            # Gestión de estado global (Ej. Autenticación)
│   ├── data/                # Capa de datos de persistencia nativa SQLite
│   ├── pages/               # Vistas del enrutamiento (Dashboard, Facturas, etc.)
│   ├── utils/               # Funciones auxiliares (Generador PDF, formateos)
│   ├── App.jsx              # Gestor de Rutas central
│   ├── main.jsx             # Punto de entrada de inicialización de la app
│   └── index.css            # Archivos globales para componentes / utilidades de UI
├── vite.config.js           # Orquestador de empaquetado Vite
├── package.json             # Dependencias Node y Scripts NPM
└── README.md                # Este archivo
```

---

## 🚀 Requisitos Previos

Dado que la aplicación ha evolucionado a Tauri, para contribuir requieres compilar código nativo (Rust). Necesitas instalar en tu sistema:

- **Node.js** v18 o superior.
- **npm** v9 o superior (incluido con Node.js).
- Dependencias nativas de MSVC Build Tools para **Windows** (Desarrollo y compilación de C++).
- Entorno de desarrollo de **Rust** ([Rustup](https://rustup.rs/)).

---

## ⚡ Instalación y Uso

### 1. Clonar el repositorio e instalar dependencias web

```bash
git clone https://github.com/MalthaelRD04/proyecto_integrador001.git
cd proyecto_integrador001
npm install
```

### 2. Ejecutar entorno de desarrollo

```bash
npm run tauri:dev
```

> Esto inicia el servidor de recursos de **Vite** en la memoria local y de forma concurrente compila tu interfaz en **Tauri**, logrando tener *hot-reload* sobre una ventana de escritorio independiente.

### 3. Compilar instalador para distribución/producción

```bash
npm run tauri:build
```

> Esto crea un empaquetado optimizado para distribución. Una vez finalice podrás encontrar el .exe / .msi resultante dentro de los subdirectorios empaquetados bajo `src-tauri/target/release`.

---

## 🔑 Credenciales por Defecto (Seed Data)

Tras abrirse sin detectar un archivo `jrj_sistema.db` preexistente, el sistema lo creará automáticamente junto a ejemplos clave. Accede con un administrador:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | Administrador |
| `maria` | `maria123` | Empleado |

---

## 📜 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia únicamente el Frontend en modo local (Servidor Web Tradicional). *Nota: Las transacciones de Rust/SQL por plugins estarán fuera del contexto real en navegadores habituales.* |
| `npm run tauri:dev` | **(RECOMENDADO)** Ejecutar ventana de aplicación final vía Tauri en modo desarrollo de baja optimización. |
| `npm run tauri:build` | Despliegue empaquetado del bundle nativo para exportar versiones instalables. |
| `npm run build` | Optimiza y minifica solo los archivos UI JS/HTML/CSS desde el framework `Vite`. |

---

## 📝 Notas Técnicas / Cambios Recientes

- **Migración a Tauri Integrada**: La aplicación ha superado la dependencia a ElectronJS (que creaba instaladores inflados con alto costo en memoria RAM) para implementarse de forma exitosa sobre ecosistemas modernos de **Rust via Tauri**, abriendo paso a descargas mucho más rápidas y eficiencia energética.
- **Datos Relacionales Confiables (SQLite)**: Dejando atrás la simulación de tablas relacionales desde `IndexedDB/LocalStorage`, se incorpora y persiste de forma nativa base de datos estandarizadas `.db` mediante el plugin `@tauri-apps/plugin-sql`.
- **Integridad del OS**: Llamados estáticos y dinámicos para lanzar URLs de envío de recibos mediante WhatsApp (vía el plugin de OS nativo) o inyecciones con iFrames para eludir bloqueadores en diálogos de Impresión.

---

<p align="center">
  <strong>JRJ Centro de Copias y Servicios</strong><br>
  San Fernando de Monte Cristi, República Dominicana
</p>
