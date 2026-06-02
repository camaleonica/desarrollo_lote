# Loté

Proyecto de subastas para la materia. Yo me encargo del **mobile y la UI**.

## Cómo levantar la app

```bash
cd mobile
npm install
npm start
```

Si probás en el celular, cambiá la IP en `mobile/src/config/api.js`.

## Qué ya hice

Armé la app en **React Native + Expo** siguiendo los wireframes (WF-01 a WF-16). Por ahora tengo andando:

- **Auth:** splash, login, registro en dos pasos, recuperar contraseña, medios de pago
- **Subastas:** home con búsqueda y filtros, detalle de pieza, sala en vivo (puja + diálogos propios), resumen de compra y confirmación de entrega
- **Resto:** mis pujas, solicitud y listado de artículos, perfil
- **Diseño:** paleta del Figma (celeste, rosita, bordó), tipografía Roboto, componentes M3 (`Surface`, chips, tiles, etc.), popups custom en lugar de los `Alert` nativos
- **Assets:** SVGs organizados en `mobile/assets/svg/` y referencia en `assets/svg/`
- **Docs:** wireframes, mapa de pantallas y manejo de errores en `docs/`

La navegación va de login → home → subasta → puja → resumen. Cuando el backend esté corriendo, el usuario demo es `demo@lote.com` / `123456`.

## Qué falta

- Pantalla de **catálogo de subasta** (WF-07), hoy el detalle de pieza hace las veces de las dos
- Pantalla de **multas** (WF-13)
- Completar campos que faltan en registro, medios de pago, home y perfil según el wireframe
- Pulir WF-09 (timer, streaming) y métricas de mis pujas
- Backend + SQLite (auth, subastas, pujas, artículos, pagos, etc.)

---

Más detalle pantalla por pantalla: [docs/mapa-pantallas.md](docs/mapa-pantallas.md) · [docs/wireframes.md](docs/wireframes.md)
