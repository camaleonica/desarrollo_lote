# Manejo de errores — App Loté

Descripción de cómo la app mobile y el backend gestionan validaciones, alertas, conectividad y respuestas de error.

---

## 1. Arquitectura general

La app usa **dos capas de feedback** al usuario:

| Capa | Cuándo se usa | Componente |
|------|---------------|------------|
| **Error en campo** | Validación local antes de enviar el formulario | `Input`, `DniUploadField` → borde rojo + texto rojo debajo |
| **Diálogo modal** | Errores de API, confirmaciones, éxito, avisos globales | `AppDialog` vía `useDialog()` |

**Archivos clave**

| Archivo | Rol |
|---------|-----|
| `mobile/src/utils/validation.js` | Validaciones de formularios en el cliente |
| `mobile/src/services/api.js` | Red, parseo de errores HTTP, clase `ApiError` |
| `mobile/src/services/loteApi.js` | Llamadas al backend de Daniel |
| `mobile/src/context/DialogContext.js` | `showDialog()` global |
| `mobile/src/components/m3/AppDialog.js` | UI del popup (success, error, info, warning) |
| `mobile/src/components/ui/Input.js` | Campo con prop `error` y label `(opcional)` |
| `backend/src/routes/*.js` | Validación con `express-validator` (HTTP 422) |

---

## 2. Campos obligatorios

Validación **en el cliente** al tocar el botón principal de cada pantalla. Si falla, no se llama al backend.

### WF-02 · Login

| Campo | Regla | Mensaje |
|-------|-------|---------|
| Email | No vacío | `El email es obligatorio` |
| Email | Formato válido (`usuario@dominio.com`) | `El email no es válido` |
| Contraseña | No vacío | `La contraseña es obligatorio` |

Función: `validateLoginForm()` en `validation.js`.

### WF-03 · Registro paso 1

| Campo | Regla | Mensaje |
|-------|-------|---------|
| Nombre | No vacío | `El nombre es obligatorio` |
| Apellido | No vacío | `El apellido es obligatorio` |
| Domicilio legal | No vacío | `El domicilio es obligatorio` |
| País | No vacío | `El país es obligatorio` |
| Foto DNI frente | Debe tener `uri` | `Subí la foto del frente del DNI` |
| Foto DNI dorso | Debe tener `uri` | `Subí la foto del dorso del DNI` |

Función: `validateRegisterStep1()`. Las fotos se validan en `DniUploadField` (borde rojo en el recuadro de upload).

### WF-04 · Registro paso 2 (Seguridad)

| Campo | Regla | Mensaje |
|-------|-------|---------|
| Email | No vacío | `El email es obligatorio` |
| Email | Formato válido | `El email no es válido` |
| Email | Debe generarse la provisoria antes de continuar | `Confirmá el email para generar tu contraseña provisoria` |
| Contraseña provisoria | No vacía | `La contraseña provisoria es obligatorio` |
| Contraseña provisoria | Coincide con la generada | `No coincide con la contraseña provisoria generada` |
| Nueva contraseña | Mín. 8 caracteres | `La contraseña debe tener al menos 8 caracteres` |
| Nueva contraseña | Al menos un número | `La contraseña debe contener al menos un número` |
| Nueva contraseña | Distinta a la provisoria | `La nueva contraseña debe ser distinta a la provisoria` |
| Confirmar contraseña | Igual a nueva contraseña | `Las contraseñas no coinciden` |

La provisoria solo se genera si el email es válido (al salir del campo, al tocar el botón o al guardar).

Función: `validateRegisterStep2()`.

### WF-05c · Recuperar contraseña

| Campo | Regla | Mensaje |
|-------|-------|---------|
| Email | No vacío | `El email es obligatorio` |
| Email | Formato válido | `El email no es válido` |

Validación inline en la pantalla (un solo campo).

### WF-05b · Agregar medio de pago

**Tarjeta de crédito**

| Campo | Regla | Mensaje |
|-------|-------|---------|
| Últimos 4 dígitos | Obligatorio | `Los últimos 4 dígitos son obligatorios` |
| Últimos 4 dígitos | Exactamente 4 | `Ingresá exactamente 4 dígitos` |

**Cuenta bancaria**

| Campo | Regla | Mensaje |
|-------|-------|---------|
| Banco | No vacío | `El banco es obligatorio` |
| Número de cuenta | No vacío | `El número de cuenta es obligatorio` |

### WF-05a · Lista de medios de pago

| Acción | Regla | Mensaje |
|--------|-------|---------|
| Continuar al inicio | Al menos 1 medio activo | Diálogo info: `Agregá al menos un medio de pago para continuar.` |

### Solicitud de artículo (WF-14)

| Campo | Regla | Mensaje |
|-------|-------|---------|
| Título | No vacío | `El título es obligatorio` |
| Descripción | No vacío | `La descripción es obligatorio` |
| Descripción | Mín. 10 caracteres | `La descripción debe tener al menos 10 caracteres` |
| Categoría | No vacía | `La categoría es obligatorio` |

Función: `validateNewItem()`.

### Sala de subasta en vivo (WF-09)

| Campo | Regla | Mensaje |
|-------|-------|---------|
| Monto de puja | Número finito > 0 | `Ingresá un monto válido` |
| Monto de puja | Respuesta del servidor | Mensaje en el input (`err.errors.monto`) |

---

## 3. Campos opcionales

Se marcan en el label con **`(opcional)`** (`Input` con `optional={true}`).

| Pantalla | Campo opcional | Comportamiento si está vacío |
|----------|----------------|------------------------------|
| Agregar medio de pago | Marca de tarjeta | Se envía `"Tarjeta"` por defecto |
| KYC / registro | Fotos DNI en re-envío | El backend conserva las anteriores (`COALESCE`) |
| Backend medios de pago | `currency` | Default `ARS` |
| Backend medios de pago | `card_brand`, `card_exp_*` | Se guardan como `null` |

Los campos opcionales **no muestran error** si el usuario no los completa.

---

## 4. Alertas y diálogos (`AppDialog`)

La app **no usa** `Alert` nativo de React Native. Todo pasa por `showDialog()`:

```javascript
showDialog({
  title: 'Título',
  message: 'Texto para el usuario',
  variant: 'error' | 'success' | 'info' | 'warning',
  buttons: [
    { text: 'Cancelar', style: 'outline' },
    { text: 'Confirmar', style: 'primary', onPress: () => {} },
    { text: 'Eliminar', style: 'destructive', onPress: () => {} },
  ],
});
```

### Variantes visuales

| `variant` | Uso típico | Color |
|-----------|------------|-------|
| `success` | Guardado, puja OK, recupero enviado | Verde (`teal`) |
| `error` | Login fallido, error de servidor | Rojo |
| `info` | Avisos, contraseña provisoria generada, medio requerido | Bordó |
| `warning` | Confirmar eliminación, streaming no disponible | Naranja |

### Diálogos por situación

| Pantalla / acción | Variant | Mensaje (resumen) |
|-------------------|---------|---------------------|
| Login incorrecto | `error` | Usuario o contraseña incorrectos |
| Email ya registrado | Campo rojo | Ya existe una cuenta con ese email |
| Provisoria generada | `info` | Te asignamos una contraseña provisoria… |
| Provisoria incorrecta (401) | Campo rojo | La contraseña provisoria no es correcta |
| Medio de pago guardado | `success` | Medio de pago agregado correctamente |
| Eliminar medio de pago | `warning` + botones | ¿Querés eliminar este medio de pago? |
| Continuar sin medios | `info` | Agregá al menos un medio de pago… |
| Recuperar contraseña OK | `success` | Mensaje genérico del backend |
| Puja registrada | `success` | Tu oferta de $X quedó activa… |
| Cerrar sesión | `info` + botones | ¿Querés salir de tu cuenta? |
| Error al cargar listas | `error` | Mensaje del API o texto genérico |

---

## 5. Conexión a internet y servidor

Antes de **cada** request (`apiRequest` y `apiMultipartRequest`), se consulta `@react-native-community/netinfo`:

```javascript
checkConnection() → isConnected && isInternetReachable !== false
```

| Código interno | Cuándo | Mensaje al usuario |
|----------------|--------|-------------------|
| `NO_CONNECTION` | Sin red o sin internet alcanzable | `Sin conexión a internet. Revisá tu red e intentá de nuevo.` |
| `NETWORK_ERROR` | `fetch` falla (servidor apagado, IP incorrecta, timeout) | `No se pudo conectar con el servidor. Verificá que el backend esté activo.` |

**Configuración:** la URL del backend está en `mobile/src/config/api.js` (puerto `3006`; en Android emulador usa `10.0.2.2`, en dispositivo físico la IP local de la PC).

---

## 6. Errores del backend

### Formato de respuesta

```json
// Error simple
{ "message": "Credenciales inválidas" }

// Con código de negocio
{ "message": "El email ya está registrado", "code": "EMAIL_EXISTS" }

// Validación (express-validator)
{
  "errors": [
    { "path": "new_password", "msg": "La contraseña debe tener al menos 8 caracteres" }
  ]
}
```

### HTTP status y acción en la app

| HTTP | Situación | Acción en mobile |
|------|-----------|------------------|
| **401** | Credenciales inválidas / token expirado | Diálogo o error en campo (login, provisoria) |
| **404** | Ruta o recurso no encontrado | Diálogo; subastas devuelven lista vacía si el módulo no existe |
| **409** | Email duplicado (`code: EMAIL_EXISTS`) | Error en campo email |
| **422** | Validación `express-validator` | Errores mapeados a campos cuando la pantalla lo soporta |
| **500** | Error interno | Diálogo con mensaje genérico |

### Clase `ApiError` (mobile)

```javascript
new ApiError(message, { status, code, errors })
```

Propiedades usadas en pantallas:
- `error.message` → texto del diálogo
- `error.status` → 401 en login
- `error.code` → `EMAIL_EXISTS`, `NO_CONNECTION`, `NETWORK_ERROR`
- `error.errors` → objeto o array de errores por campo

---

## 7. Validación en el backend 

| Endpoint | Validación servidor |
|----------|---------------------|
| `POST /auth/register` | Email válido |
| `POST /auth/login` | Email + contraseña no vacía |
| `POST /auth/change-password` | Provisoria no vacía; nueva ≥ 8 chars + número |
| `POST /auth/forgot-password` | Email válido |
| `POST /users/me/kyc` | Nombre, apellido, domicilio; multipart DNI |
| `POST /payment-methods` | Tipo `credit_card` \| `bank_account`; last4 o cuenta según tipo |
| `DELETE /payment-methods/:id` | ID entero válido |

Si falla → **HTTP 422** con array `errors`.

---

## 8. Flujo integrado — Autenticación (Flujo 1)

```
WF-03  validateRegisterStep1 → errores en campos
  ↓
WF-04  email válido → registerProvisional
       errores locales → changePassword + submitKyc (multipart)
       401 → provisoria incorrecta en campo
       EMAIL_EXISTS → email en rojo
  ↓
WF-05a sin medios → diálogo info
       con medios → completeRegistration → Home
  ↓
WF-06  Home (usuario autenticado)
```

**Sesión:** tokens en `AsyncStorage` (`lote_token`, `lote_refresh_token`). Si el bootstrap falla al abrir la app, se limpia la sesión (`clearSession`).

---

## 9. Resumen visual para el usuario

```
┌─────────────────────────────────────────┐
│  Usuario completa un formulario         │
└─────────────────┬───────────────────────┘
                  ▼
         ¿Campos obligatorios OK?
                  │
        NO ───────┴─────── SÍ
        │                  │
        ▼                  ▼
  Borde rojo +        ¿Hay internet?
  texto bajo               │
  el campo         NO ─────┴──── SÍ
        │                  │         │
        │                  ▼         ▼
        │            Diálogo     Request API
        │            NO_CONNECTION │
        │                  │       ▼
        │                  │  ¿Respuesta OK?
        │                  │       │
        │                  │  NO ──┴── SÍ
        │                  │   │        │
        │                  │   ▼        ▼
        │                  │ Diálogo  Éxito /
        │                  │ error    navegación
        └──────────────────┴──────────┘
```

---

## 10. Pendiente / módulos sin backend

| Módulo | Comportamiento ante error |
|--------|---------------------------|
| Subastas (`/auctions`) | 404 → lista vacía, sin crash |
| Pujas, actividades, artículos propios | Diálogo de error o datos mock según pantalla |

