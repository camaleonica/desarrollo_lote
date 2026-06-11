# Estructura del proyecto

Monorepo TPO — mobile (Expo), backend (Express + MySQL) y documentación.

```
desarrollo_lote/
├── README.md
├── package.json              # Scripts: mobile, backend, setup:db
├── backend/
│   ├── database/
│   │   ├── schema.sql        # Esquema completo (fuente de verdad)
│   │   └── seed.sql          # Datos demo
│   ├── public/
│   │   ├── empleado/         # Panel web KYC / artículos / pagos
│   │   └── reset/            # Página de recupero de contraseña
│   ├── scripts/
│   │   ├── setup-db.js
│   │   └── test-email.js
│   ├── src/
│   │   ├── app.js
│   │   ├── config/           # DB, multer (avatar, DNI, productos)
│   │   ├── controllers/
│   │   ├── jobs/             # Cierre de subastas, multas
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/         # Email, cierre, reglas de pago
│   │   ├── utils/
│   │   └── ws/               # WebSocket subastas
│   └── uploads/
│       ├── avatars/          # Runtime (no versionar fotos)
│       ├── dni/
│       └── demo/             # Imágenes demo de subastas
├── docs/
│   ├── estructura.md
│   ├── wireframes.md
│   ├── mapa-pantallas.md
│   ├── manejo-errores.md
│   └── resumen-defensa.md
└── mobile/
    ├── app.json
    ├── assets/               # Branding, iconos SVG, imágenes
    └── src/
        ├── app/              # App.js, providers
        ├── components/       # auth, auction, layout, m3, ui
        ├── config/           # URL de la API
        ├── context/          # Auth, diálogos
        ├── hooks/
        ├── navigation/
        ├── screens/          # auth, auctions, activities, items, profile
        ├── services/         # api, loteApi, auctionSocket
        ├── theme/
        └── utils/
```

## Qué no va al repositorio

- `backend/.env` — credenciales locales
- `backend/uploads/avatars/*`, `backend/uploads/dni/*` — archivos de usuarios
- `*.docx`, `tmp_docx/` — consigna y extracciones locales
- `node_modules/`, builds de Expo
