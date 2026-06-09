# Loté

## Cómo levantar la app

```bash
cd mobile
npm install
npm start
```

Si probás en el celular, cambiá la IP en `mobile/src/config/api.js`.

### Backend

**1. Instalar MySQL** (si no lo tenés):

- Opción fácil: [XAMPP](https://www.apachefriends.org/) → instalá y en el panel iniciá **MySQL**
- Opción directa: [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)

**2. Configurar y levantar:**

```bash
cd backend
cp .env.example .env   # en Windows: Copy-Item .env.example .env
```

Editá `backend/.env` con tu usuario y contraseña de MySQL (`DB_PASSWORD`).

```bash
npm install
npm run setup:db    # crea lote_db y las tablas
npm start
```

API en `http://localhost:3006` (puerto definido en `.env`).

## Qué ya hice

Armé la app en **React Native + Expo** siguiendo los wireframes (WF-01 a WF-16). Por ahora tengo andando:

- **Auth:** splash, login, registro en dos pasos, recuperar contraseña, medios de pago
- **Subastas:** home con búsqueda y filtros, detalle de pieza, sala en vivo (puja + diálogos propios), resumen de compra y confirmación de entrega
- **Resto:** mis pujas, solicitud y listado de artículos, perfil
- **Diseño:** paleta del Figma (celeste, rosita, bordó), tipografía Roboto, componentes M3 (`Surface`, chips, tiles, etc.), popups custom en lugar de los `Alert` nativos
- **Estructura:** ver [docs/estructura.md](docs/estructura.md)
- **Docs:** wireframes, mapa de pantallas y manejo de errores en `docs/`

La navegación va de login → home → subasta → puja → resumen. Registrate con email y contraseña (mín. 8 caracteres + un número).

## Qué falta

- Pantalla de **catálogo de subasta** (WF-07), hoy el detalle de pieza hace las veces de las dos
- Pantalla de **multas** (WF-13)
- Completar campos que faltan en registro, medios de pago, home y perfil según el wireframe
- Pulir WF-09 (timer, streaming) y métricas de mis pujas
- Integrar mobile con el backend (auth, subastas, pujas, artículos, pagos)

---

Más detalle: [docs/estructura.md](docs/estructura.md) · [docs/manejo-errores.md](docs/manejo-errores.md) · [docs/mapa-pantallas.md](docs/mapa-pantallas.md) · [docs/wireframes.md](docs/wireframes.md)
