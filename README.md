# Loté

Plataforma de subastas mobile-first (React Native + Expo) con API Node.js + MySQL.

## Requisitos

- Node.js 18+
- XAMPP (MySQL) para desarrollo local
- Expo Go en el celular (opcional)

## Backend (XAMPP + API local)

1. Iniciá **MySQL** en XAMPP.
2. Configurá el entorno:

```bash
cd backend
Copy-Item .env.example .env   # Windows
# Editá DB_PASSWORD y JWT secrets
npm install
npm run setup:db
npm start
```

API en `http://localhost:3006`.

### Variables importantes (`backend/.env`)

| Variable | Uso |
|---|---|
| `AUTO_APPROVE_KYC=false` | KYC manual por empleado (consigna TPO). `true` auto-aprueba en dev |
| `ADMIN_API_KEY` | Header `X-Admin-Key` para `/admin/*` y panel web |
| `SMTP_*` | Email real (sin SMTP → log en consola) |

### Email real (Gmail)

1. En [Google Cuenta → Seguridad](https://myaccount.google.com/security) activá **verificación en 2 pasos**.
2. Buscá **Contraseñas de aplicaciones** → app **Correo** → dispositivo **Otro (Loté)**.
3. Copiá la clave de 16 caracteres en `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=abcdefghijklmnop
EMAIL_FROM=tu_correo@gmail.com
```

4. Reiniciá el backend y probá:

```bash
cd backend
npm run test:email
```

5. En la app: **Olvidé mi contraseña** → debería llegar el mail con enlace a `/reset/?token=...`.

> `EMAIL_FROM` debe ser el mismo Gmail que `SMTP_USER`. Sin SMTP, el enlace solo aparece en la consola como `[email:mock]`.

### Modo invitado (mobile)

En WF-02 Login → **Explorar sin registrarme**: podés ver subastas, catálogos y detalle de piezas. No podés pujar ni ingresar a la sala (consigna: participar requiere registro verificado + medios de pago).

### Admin / empleado de la empresa

Panel web en **`http://localhost:3006/empleado/`** (clave = `ADMIN_API_KEY` en `.env`, ej. `ADMIN`):

- Pantalla de login clara + menú lateral con contadores de pendientes
- 3 pasos: KYC → artículos → medios de pago
- Pestaña **Ayuda** con usuarios demo y flujo de recupero de contraseña

- Verificar postores (KYC) y asignar categoría (`clientes.admitido`, `clientes.categoria`, `empleados.verificador`)
- Revisar artículos (`productos.estado_solicitud`)
- Verificar cheques certificados (`medios_pago.verificado`)

Usuarios demo tras `npm run setup:db` (contraseña `Demo1234!`):

| Email | Uso |
|---|---|
| `pendiente@lote.app` | KYC pendiente (aparece en panel admin) |
| `postor@lote.app` | Postor categoría plata, con medio de pago |

```bash
curl -H "X-Admin-Key: TU_CLAVE" http://localhost:3006/admin/kyc/pending
curl -X PATCH -H "X-Admin-Key: TU_CLAVE" -H "Content-Type: application/json" \
  -d '{"admitido":"si","categoria":"plata"}' http://localhost:3006/admin/clients/ID/kyc
```

## Mobile

```bash
cd mobile
npm install
npm start
```

### Conectar al backend

- **Emulador Android:** `10.0.2.2:3006` (automático)
- **Celular físico:** editá `LOCAL_IP` en `mobile/src/config/api.js`
- **Render (producción):** definí `EXPO_PUBLIC_API_URL=https://tu-api.onrender.com`

```bash
# Ejemplo Render
set EXPO_PUBLIC_API_URL=https://lote-api.onrender.com
npm start
```

## Deploy en Render

1. Subí el repo a GitHub.
2. En Render: **New Blueprint** → seleccioná `render.yaml`.
3. Configurá MySQL externo (PlanetScale, Railway, Aiven, etc.) y completá las env vars.
4. Ejecutá el schema contra esa base (`npm run setup:db` apuntando al host remoto).

## Funcionalidades implementadas (TPO)

- Modo invitado: explorar subastas sin participar
- Registro 2 etapas + KYC verificado por empleado + medios de pago (tarjeta, cuenta, cheque certificado)
- Panel empleado web: verificaciones KYC, artículos y medios de pago
- Subastas con catálogo, categorías, moneda ARS/USD
- Pujas con reglas ±1%/±20% (excepto oro/platino)
- WebSocket para actualizaciones en vivo
- Compra, entrega, multas automáticas por impago (72 h)
- Solicitud de artículos con mínimo 6 fotos
- Dueño: ubicación en depósito y póliza (`GET /items/:id/tracking`)
- Cierre de subasta: empresa compra al precio base si no hay pujas

## Stack mobile (consigna del profe)

Ya incluido en el proyecto:

- `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`
- `react-native-screens`, `react-native-safe-area-context`
- `@react-native-async-storage/async-storage`

`react-native-paper` no se usa: la UI sigue el diseño Figma propio del equipo.

## Documentación

- [docs/wireframes.md](docs/wireframes.md)
- [docs/mapa-pantallas.md](docs/mapa-pantallas.md)
- [docs/manejo-errores.md](docs/manejo-errores.md)
