# Resumen para la defensa / pregunta del profe — Loté

Guía para explicar el proyecto en 5–10 minutos y responder preguntas típicas.

---

## 1. Qué es el proyecto

**Loté** es una app de **subastas en vivo** (mobile + API). Monorepo en GitHub:

| Parte | Tecnología | Rol |
|-------|------------|-----|
| **Mobile** | React Native + Expo SDK 54 | UI según wireframes Figma (WF-01 a WF-16) |
| **Backend** | Node.js + Express + MySQL | Auth, KYC, medios de pago (compañero Daniel) |
| **Docs** | Markdown en `docs/` | Wireframes, errores, estructura |

**División del equipo (lo que podés decir):**
- **Vos:** diseño UI, mobile, Flujo 1 completo, documentación, integración con API de auth/pagos.
- **Daniel:** backend, base de datos, endpoints.

---

## 2. Arquitectura del código (mobile)

```
mobile/src/
├── app/App.js          → Entrada: splash → fuentes → AuthProvider → navegación
├── context/            → AuthContext (sesión), DialogContext (popups)
├── navigation/         → AuthStack (sin login) / AppStack (logueado) + tabs
├── screens/            → Por feature: auth, auctions, activities, items, profile
├── services/
│   ├── api.js          → HTTP, tokens, NetInfo, clase ApiError
│   └── loteApi.js      → Adaptador a la API de Daniel
├── utils/validation.js → Validación de formularios en el cliente
└── theme/              → Colores Figma, tipografía Roboto/Rubik
```

**Navegación:**
- Si **no hay usuario** o falta medio de pago → `AuthStack` (login, registro, pagos).
- Si **usuario + medio de pago** → `AppStack` → `MainTabs` (Home, Actividades, Artículos, Perfil).

**Estado global:** `AuthContext` guarda `user`, `pendingPaymentSetup`, tokens en `AsyncStorage`.

---

## 3. Flujo 1 — Autenticación (lo que está cerrado)

Es lo que **sí corre en celular** contra el backend real.

```
WF-01 Splash (logo + animación)
    ↓
WF-02 Login ──────────────────→ WF-06 Home (si ya tiene sesión + medio de pago)
    ↓
WF-03 Registro paso 1
    (nombre, apellido, domicilio, país, fotos DNI → draft en memoria)
    ↓
WF-04 Registro paso 2
    (email → contraseña provisoria del servidor → nueva contraseña → KYC)
    ↓
WF-05a Medios de pago (obligatorio ≥1)
    ↓
WF-06 Home
```

**WF-05c** Recuperar contraseña: pantalla + `POST /auth/forgot-password`.

### Qué pasa en el backend en el registro

1. `POST /auth/register` → solo email, devuelve **contraseña provisoria** + JWT.
2. `POST /auth/change-password` → reemplaza provisoria por definitiva.
3. `POST /users/me/kyc` → multipart con datos + fotos DNI.
4. `GET/POST/DELETE /payment-methods` → medios de pago.
5. `GET /users/me` → perfil para entrar al Home.

### Validaciones y errores

- **Campos:** borde rojo + mensaje bajo el input (`Input`, `DniUploadField`).
- **API / red:** diálogos custom `AppDialog` (no `Alert` nativo).
- **Sin internet:** `NetInfo` antes de cada request → mensaje claro.
- Documentado en `docs/manejo-errores.md`.

---

## 4. Otros flujos (UI lista, back parcial)

| Flujo | Pantallas | Estado |
|-------|-----------|--------|
| **2 Subastas** | Home, detalle, sala en vivo, pieza ganada, entrega | UI hecha; subastas/pujas **sin API** (lista vacía o mock si 404) |
| **3 Actividades** | Mis pujas + métricas | UI; datos mock |
| **4 Artículos** | Solicitud + listado | UI; back pendiente |
| **5 Perfil** | Datos, link a medios de pago, cerrar sesión | UI básica |

**Honesto ante el profe:** "El **Flujo 1 está integrado end-to-end**. El resto tiene la navegación y el diseño; falta que el backend exponga subastas, pujas, artículos, etc."

---

## 5. Backend (para explicar en 30 segundos)

```
backend/
├── database/schema.sql   → users, user_profiles, payment_methods, refresh_tokens
├── src/routes/           → /auth, /users, /payment-methods
├── src/controllers/      → lógica
├── src/middleware/auth.js → JWT Bearer
└── uploads/dni/          → fotos KYC
```

- Contraseñas con **bcrypt**.
- Sesión con **access + refresh token**.
- MySQL en XAMPP, puerto API **3006**.

---

## 6. Preguntas que te puede hacer el profe (y cómo responder)

### Sobre el producto / diseño

**¿Por qué wireframes WF-XX?**  
"Numeramos pantallas como en Figma para que diseño, mobile y back hablen el mismo idioma. Está en `docs/wireframes.md`."

**¿Qué entregaste vos concretamente?**  
"Flujo 1 completo: registro con KYC y DNI, login, recupero de clave, medios de pago obligatorios, splash, manejo de errores documentado, y la app probada en celular contra el backend."

**¿Por qué el medio de pago es obligatorio?**  
"En el wireframe WF-04/05a: sin medio de pago no podés participar en subastas. La app no deja entrar al Home hasta tener al menos uno."

---

### Sobre arquitectura / código

**¿Por qué React Native y no web?**  
"Es app móvil para subastas en vivo; Expo facilita probar en celular con el mismo código iOS/Android."

**¿Cómo manejan la sesión?**  
"JWT en AsyncStorage. `AuthContext` al abrir la app valida token, carga perfil y medios de pago. Si no hay medios, manda a WF-05a."

**¿Cómo se comunica el front con el back?**  
"`loteApi.js` centraliza las llamadas. `api.js` hace el fetch, revisa conexión y parsea errores en `ApiError`."

**¿Por qué dos stacks de navegación (AuthStack / AppStack)?**  
"Separar usuario no autenticado del autenticado. Cuando `canAccessApp` pasa a true, se remonta el `NavigationContainer` y entra al Home."

**¿Dónde validan: cliente o servidor?**  
"En ambos. Cliente para UX inmediata; servidor con `express-validator` (422) por seguridad."

---

### Sobre errores y UX

**¿Cómo avisan si no hay internet?**  
"Antes de cada request, `NetInfo`. Si no hay red, mensaje: 'Sin conexión a internet…'. Si el servidor no responde, 'Verificá que el backend esté activo'."

**¿Por qué no usan Alert nativo?**  
"Para respetar la paleta y el diseño: `AppDialog` con variantes success/error/info/warning."

---

### Sobre base de datos / seguridad

**¿Cómo guardan las contraseñas?**  
"Hash bcrypt en MySQL, nunca texto plano."

**¿Cómo suben las fotos del DNI?**  
"Multipart con `expo-image-picker` en el registro; el back guarda rutas en `user_profiles`."

**¿Qué es KYC?**  
"Know Your Customer: verificación de identidad (nombre, domicilio, fotos DNI) antes de operar."

---

### Sobre trabajo en equipo

**¿Por qué un solo repo?**  
"Monorepo: `mobile/`, `backend/`, `docs/` juntos. Facilita que todos clonen lo mismo y la API coincida con la app."

**¿Qué hizo cada uno?**  
"Yo mobile + UI + Flujo 1 + docs. Daniel backend + MySQL. Subastas y pujas: UI mía, API aún del lado de Daniel."

**Si pregunta por otro repo de Daniel:**  
"Hubo un desvío temporal; el acuerdo es unificar en `desarrollo_lote`. Mi mobile ya consume la API de este backend."

---

### Preguntas "trampa" — respuestas honestas

**¿Está todo integrado?**  
"**Flujo 1 sí**, de punta a punta. Subastas, pujas y artículos: pantallas listas, endpoints del back **pendientes**."

**¿Qué falta?**  
"WF-07 catálogo separado, WF-13 multas, más campos en home/perfil según Figma, y conectar flujos 2–5 al backend cuando existan las rutas."

**¿Cómo lo prueban en el celular?**  
"Backend en la PC (`localhost:3006`), IP local en `mobile/src/config/api.js`, Expo Go escaneando el QR."

**¿Demo usuario?**  
"Registro nuevo con email real o login si ya hay cuenta; no hay usuario demo fijo obligatorio."

---

## 7. Frase de cierre (30 segundos)

> "Loté es una plataforma de subastas mobile-first. Implementamos el **Flujo 1 de autenticación** alineado a Figma y conectado a una API Express + MySQL: registro con verificación KYC, contraseña provisoria, medios de pago y manejo de errores documentado. El resto de flujos tiene la **interfaz y navegación** preparadas para cuando el backend exponga subastas, pujas y artículos. El código está organizado por capas en `mobile/src` y documentado en `docs/`."

---

## 8. Archivos que conviene tener abiertos si te pregunta "mostráme código"

| Tema | Archivo |
|------|---------|
| Entrada app | `mobile/src/app/App.js` |
| Sesión | `mobile/src/context/AuthContext.js` |
| API | `mobile/src/services/loteApi.js` |
| Registro | `RegisterStep1Screen.js`, `RegisterStep2Screen.js` |
| Medios de pago | `PaymentMethodsScreen.js`, `AddPaymentScreen.js` |
| Errores | `docs/manejo-errores.md`, `validation.js` |
| Back auth | `backend/src/routes/auth.js`, `authController.js` |
