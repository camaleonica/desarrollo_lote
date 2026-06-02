# Mapa WF → implementación mobile

Estado para coordinación **front (diseño/UI)** vs **back (API/BD)**.

Leyenda: ✅ UI alineada · 🟡 parcial · ❌ falta pantalla o campos · 🔌 depende del back

| ID | Pantalla | Archivo actual | UI | Back |
|----|----------|----------------|----|------|
| WF-01 | Splash | `SplashScreen.js` | 🟡 Falta indicador de carga explícito | — |
| WF-02 | Login | `LoginScreen.js` | ✅ | ✅ demo |
| WF-03 | Registro 1 | `RegisterStep1Screen.js` | 🟡 Sin domicilio, país, uploads DNI | 🔌 |
| WF-04 | Registro 2 | `RegisterStep2Screen.js` | 🟡 Campos distintos al spec | 🔌 |
| WF-05a | Medios de pago lista | `PaymentMethodsScreen.js` | 🟡 Sin moneda/estado/eliminar | 🔌 |
| WF-05b | Agregar medio | `AddPaymentScreen.js` | 🟡 Falta moneda, banco, cancelar | 🔌 |
| WF-05c | Recuperar contraseña | `ForgotPasswordScreen.js` | ✅ | 🟡 mock |
| WF-06 | Home subastas | `HomeScreen.js` | 🟡 Falta header usuario, bloqueo categoría | 🔌 |
| WF-07 | Catálogo subasta | — | ❌ Hoy `AuctionDetail` = pieza (WF-08) | 🔌 |
| WF-08 | Detalle pieza | `AuctionDetailScreen.js` | 🟡 Sin galería ni nº pieza | 🔌 |
| WF-09 | Sala en vivo | `AuctionRoomScreen.js` | 🟡 Sin timer, streaming, link | 🔌 polling |
| WF-11 | Pieza ganada | `WonAuctionScreen.js` | ✅ UI WF-11 | 🔌 |
| WF-11b | Confirmación entrega | `DeliveryConfirmationScreen.js` | ✅ UI WF-11b | 🔌 |
| WF-12 | Mis pujas | `ActivitiesScreen.js` | 🟡 Métricas incompletas | 🔌 |
| WF-13 | Multas | — | ❌ | 🔌 |
| WF-14 | Solicitud artículo | `NewItemScreen.js` | 🟡 Campos distintos, sin fotos/legal | 🔌 |
| WF-15 | Estado artículos | `ItemsScreen.js` | 🟡 Sin aceptar/rechazar condiciones | 🔌 |
| WF-16 | Perfil | `ProfileScreen.js` | 🟡 Placeholder menú | 🔌 |

## Tabs (WF-06 nav)

| Tab label spec | Tab actual | WF |
|----------------|------------|-----|
| Subastas | Home | WF-06 |
| Mis Pujas | Actividades | WF-12 |
| Mis Artículos | Artículos | WF-15 |
| Perfil | Perfil | WF-16 |

## Prioridad sugerida — solo front (vos)

1. Renombrar/organizar carpetas por flujo (`screens/auth`, `auctions`, `activities`, `items`, `profile`).
2. Completar WF-01 (loader), WF-03/04 según Figma.
3. Separar WF-07 (catálogo) de WF-08 (detalle pieza).
4. WF-09 timer + estados visuales (mock hasta que el back tenga WS/timer).
5. WF-11 + WF-11b flujo post-puja.
6. WF-13 multas (UI estática primero).
7. WF-16 perfil completo + links a WF-05a.

## Contrato sugerido para tu compañero (back)

Endpoints mínimos por flujo (además de lo ya existente):

- Registro: domicilio, país, URLs DNI, contraseña provisoria.
- Subastas: listado con fecha/hora/lugar/rematador/moneda/estado/categoría requerida.
- Catálogo WF-07: piezas por subasta con número y precio base.
- Puja: timer de cierre, validación categoría + medio de pago.
- Post-compra: comisiones, opciones entrega, confirmación WF-11b.
- Actividades: métricas agregadas (sin historial detallado).
- Multas: CRUD + pago.
- Artículos: upload fotos, estados, aceptar/rechazar condiciones.
- Perfil: categoría, forma de pago default, cuenta cobro.
