# FinanceFlow 💰

Aplicación web de gestión financiera personal que te permite registrar, categorizar y analizar tus gastos de manera sencilla e intuitiva.

## ✨ Características Principales

- 📊 **Dashboard interactivo** con resumen de gastos y visualizaciones
- 💳 **Gestión de tarjetas de crédito** con seguimiento de pagos
- 📁 **Categorías personalizables** con iconos y colores
- 📈 **Reportes y análisis** por período (Mensual, Semanal, Anual)
- 🔐 **Autenticación segura** con Firebase
- 🌙 **Modo oscuro/claro**
- 📱 **PWA** - Instalable como aplicación móvil
- ⚡ **Sincronización en tiempo real**

## 🚀 Funcionalidades

### Autenticación
- Registro de nuevos usuarios
- Inicio de sesión con email y contraseña
- Recuperación de contraseña
- Verificación de email
- Opción "Mantener sesión abierta" para persistencia de sesión

### Dashboard
- Resumen total de gastos
- Gráfico de pastel por categorías
- Lista de últimas transacciones
- Navegación rápida a funciones principales

### Agregar Gastos
- Formulario completo para registrar gastos
- Selección de categoría y subcategoría
- Soporte para múltiples monedas (USD, ARS)
- Fecha personalizable
- Opción de pago con tarjeta de crédito
- Registro de fecha de pago para tarjetas

### Historial
- Lista completa de todas las transacciones
- Filtros y búsqueda
- Visualización detallada de cada gasto

### Reportes y Análisis
- Análisis por período:
  - **Mensual**: Vista del mes actual
  - **Semanal**: Vista de la semana actual
  - **Anual**: Vista del año actual
- Gráficos de barras y áreas
- Desglose por categorías
- Comparativas de gastos

### Gestión de Categorías
- Crear, editar y eliminar categorías
- Personalización de iconos (40+ iconos disponibles)
- Personalización de colores
- Gestión de subcategorías
- Categorías predefinidas al registrarse

### Tarjetas de Crédito
- Agregar múltiples tarjetas
- Soporte para diferentes redes (Visa, Mastercard, American Express, Mercadolibre)
- Visualización de tarjetas con imágenes personalizadas
- Seguimiento de pagos pendientes

### Configuración
- Ajustes de cuenta
- Cambio de moneda preferida
- Cierre de sesión

## 🛠️ Tecnologías

- **React 19** - Framework frontend
- **TypeScript** - Tipado estático
- **Firebase Authentication** - Autenticación de usuarios
- **Cloud Firestore** - Base de datos en tiempo real
- **React Router** - Navegación
- **Recharts** - Gráficos y visualizaciones
- **Vite** - Build tool y dev server
- **PWA** - Progressive Web App support
- **Tailwind CSS** - Estilos (implícito por las clases)

## 📋 Requisitos Previos

- **Node.js** (versión 16 o superior)
- **npm** o **yarn**
- Proyecto de Firebase configurado con:
  - Authentication habilitado
  - Firestore Database creada

## ⚙️ Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
VITE_FIREBASE_MEASUREMENT_ID=tu_measurement_id (opcional)
```

Puedes obtener estas credenciales desde la consola de Firebase:
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a Configuración del proyecto
4. En "Tus aplicaciones", selecciona la app web o crea una nueva
5. Copia las credenciales al archivo `.env`

### 3. Configurar Firestore

Asegúrate de tener las siguientes colecciones en Firestore:
- `users` - Información de usuarios
- `transactions` - Transacciones/gastos
- `categories` - Categorías de gastos
- `creditCards` - Tarjetas de crédito

Las reglas de seguridad deben permitir que los usuarios solo accedan a sus propios datos.

### 4. Ejecutar la aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📦 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción

## 🏗️ Estructura del Proyecto

```
financeflow/
├── components/          # Componentes reutilizables
│   ├── BottomNav.tsx   # Navegación inferior
│   ├── Layout.tsx      # Layout principal
│   ├── PrivateRoute.tsx # Rutas protegidas
│   └── ...
├── contexts/           # Contextos de React
│   ├── AuthContext.tsx # Contexto de autenticación
│   └── ToastContext.tsx # Contexto de notificaciones
├── pages/              # Páginas de la aplicación
│   ├── auth/          # Páginas de autenticación
│   ├── Dashboard.tsx  # Página principal
│   ├── AddExpense.tsx # Agregar gastos
│   ├── ExpenseList.tsx # Historial
│   ├── Reports.tsx    # Reportes
│   └── ...
├── firebase.ts        # Configuración de Firebase
├── types.ts           # Tipos TypeScript
└── constants.ts       # Constantes de la aplicación
```

## 🔒 Seguridad y Persistencia de Sesión

La aplicación incluye un checkbox "Mantener sesión abierta" en la pantalla de login:

- **Marcado**: La sesión persiste en `localStorage` y se mantiene hasta que expire el token (aproximadamente 30 días sin actividad) o se cierre sesión manualmente
- **Desmarcado**: La sesión solo dura mientras la pestaña del navegador esté abierta

Los tokens de Firebase se renuevan automáticamente cada hora aproximadamente mientras haya actividad.

## 📱 PWA (Progressive Web App)

La aplicación es instalable como PWA:
- Instalable en dispositivos móviles y de escritorio
- Funciona offline (con datos cacheados)
- Actualización automática cuando hay nuevas versiones

## 🎨 Características de UI/UX

- Diseño móvil-first y responsive
- Modo oscuro y claro
- Navegación intuitiva con barra inferior
- Notificaciones toast para feedback del usuario
- Iconos Material Symbols
- Animaciones y transiciones suaves

## 📄 Licencia

Este proyecto está licenciado bajo la [MIT License](LICENSE).

Puedes usar, modificar y distribuir este código libremente, siempre y cuando incluyas el aviso de copyright y la licencia en todas las copias o partes sustanciales del software.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Si tienes sugerencias o encuentras bugs, por favor abre un issue o envía un pull request.
