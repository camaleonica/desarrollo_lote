# Estructura del proyecto

Monorepo con mobile (Expo), backend (Express) y documentación.

```
desarrollo_lote/
├── backend/
│   ├── database/          # Esquema SQL
│   ├── scripts/           # setup-db y utilidades
│   ├── src/
│   │   ├── config/        # DB, multer
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   └── uploads/           # Archivos subidos en runtime
├── docs/                  # wireframes, mapa, manejo de errores
├── mobile/
│   ├── assets/
│   │   ├── branding/      # Iconos de la app (Expo)
│   │   ├── icons/         # SVGs en uso
│   │   └── images/        # Imágenes (splash, subastas)
│   ├── src/
│   │   ├── app/           # Entrada y providers
│   │   ├── assets/        # Registro de assets (JS)
│   │   ├── components/
│   │   │   ├── auction/   # Componentes de dominio
│   │   │   ├── icons/
│   │   │   ├── layout/
│   │   │   ├── m3/        # Material Design 3
│   │   │   └── ui/        # Botones, inputs, texto
│   │   ├── config/
│   │   ├── context/
│   │   ├── navigation/
│   │   ├── screens/       # Por feature (auth, auctions, …)
│   │   ├── services/
│   │   ├── theme/
│   │   └── utils/
│   ├── app.json
│   └── index.js
└── package.json           # Scripts del monorepo
```
