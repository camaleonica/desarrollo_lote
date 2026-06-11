# Mapa WF → implementación mobile

Estado actual del código (mobile). Leyenda: ✅ implementado · 🟡 parcial · 🔌 requiere backend en vivo

| ID | Pantalla | Archivo | Estado |
|----|----------|---------|--------|
| WF-01 | Splash | `SplashScreen.js` | ✅ |
| WF-02 | Login + invitado | `LoginScreen.js` | ✅ |
| WF-03 | Registro 1 | `RegisterStep1Screen.js` | ✅ |
| WF-04 | Registro 2 + KYC | `RegisterStep2Screen.js` | ✅ |
| WF-05a | Medios de pago | `PaymentMethodsScreen.js` | ✅ |
| WF-05b | Agregar medio | `AddPaymentScreen.js` | ✅ |
| WF-05c | Recuperar contraseña | `ForgotPasswordScreen.js` | 🟡 UI lista; email depende de SMTP |
| WF-06 | Home subastas | `HomeScreen.js` | ✅ |
| WF-07 | Catálogo subasta | `AuctionCatalogScreen.js` | ✅ |
| WF-08 | Detalle pieza | `AuctionDetailScreen.js` | ✅ |
| WF-09 | Sala en vivo | `AuctionRoomScreen.js` | ✅ WebSocket + pujas |
| WF-11 | Pieza ganada | `WonAuctionScreen.js` | ✅ |
| WF-11b | Confirmación entrega | `DeliveryConfirmationScreen.js` | ✅ |
| WF-12 | Mis pujas | `ActivitiesScreen.js` | ✅ |
| WF-13 | Multas | `FinesScreen.js` | ✅ |
| WF-14 | Solicitud artículo | `NewItemScreen.js` | ✅ |
| WF-15 | Estado artículos | `ItemsScreen.js` | ✅ |
| WF-16 | Perfil | `ProfileScreen.js` | ✅ |

## Navegación (tabs)

| Tab | Pantalla raíz | WF |
|-----|---------------|-----|
| Subastas | `HomeScreen` | WF-06 |
| Mis Pujas | `ActivitiesScreen` | WF-12 |
| Mis Artículos | `ItemsScreen` | WF-15 |
| Perfil | `ProfileScreen` | WF-16 |

## Componentes transversales

| Componente | Uso |
|------------|-----|
| `GuestBanner`, `GuestGate` | Modo invitado (solo lectura) |
| `KycStatusBanner` | Aviso KYC pendiente / verificado |
| `PaymentDefaultBanner` | Falta medio de pago predeterminado |
| `FormScreen` + `Input` | Formularios con teclado accesible |
| `useProfileSync` | Sincroniza usuario al volver del panel empleado |

## Panel empleado (web)

`backend/public/empleado/` — KYC, artículos y medios de pago (`ADMIN_API_KEY`).
