# Manejo de errores — App Loté

Documento de entrega que describe cómo la aplicación mobile y el backend gestionan validaciones, alertas y conectividad.

## 1. Campos obligatorios

| Pantalla | Campo | Validación cliente | Validación servidor |
|----------|-------|-------------------|---------------------|
| Login | Email | No vacío + formato email | Igual |
| Login | Contraseña | No vacío | Igual |
| Registro paso 1 | Nombre, apellido, documento | No vacío; documento mín. 6 chars | Igual |
| Registro paso 2 | Email, contraseña | Email válido; contraseña mín. 6 | Igual |
| Registro paso 2 | Confirmar contraseña | Debe coincidir | — |
| Recuperar contraseña | Email | Obligatorio + formato | Igual |
| Medio de pago | Tipo, titular, últimos dígitos | Obligatorios; dígitos mín. 4 | Igual |
| Solicitud artículo | Título, descripción, categoría | Descripción mín. 10 chars | Igual |
| Sala de subasta | Monto de puja | Numérico y mayor al mínimo | Igual |

**Comportamiento UI:** borde rojo en el input + mensaje debajo del campo.

## 2. Campos opcionales

- Tipo de documento (default: DNI)
- Fotos en solicitud de artículo (placeholder “Próximamente”)
- Botón “Agregar más tarde” en registro (omite medios de pago)

No se validan; si están vacíos no se envían o se usa valor por defecto.

## 3. Alertas al usuario

| Situación | Tipo | Mensaje |
|-----------|------|---------|
| Login incorrecto | `Alert` nativo | “Usuario o contraseña incorrectos” |
| Email ya registrado | `Alert` | “Ya existe una cuenta con ese email” |
| Puja registrada | `Alert` | Confirmación con monto |
| Recupero de contraseña | `Alert` | Mensaje genérico de envío |
| Error de servidor | `Alert` | Mensaje del API o genérico |
| Cerrar sesión | `Alert` confirmación | “¿Querés salir de tu cuenta?” |
| Cuenta creada | `Alert` | “Tu cuenta fue registrada correctamente” |

## 4. Conexión a internet

- Antes de cada request se consulta `@react-native-community/netinfo`.
- Sin conexión: error `NO_CONNECTION` → “Sin conexión a internet. Revisá tu red e intentá de nuevo.”
- Servidor caído / timeout: error `NETWORK_ERROR` → “No se pudo conectar con el servidor…”

## 5. Códigos de error del backend

| Código HTTP | code | Acción en app |
|-------------|------|---------------|
| 400 | VALIDATION_ERROR | Mostrar errores por campo |
| 401 | INVALID_CREDENTIALS / TOKEN_EXPIRED | Alerta o redirigir a login |
| 404 | NOT_FOUND | Alerta y volver atrás |
| 409 | EMAIL_EXISTS | Alerta en registro |
| 500 | SERVER_ERROR | Alerta genérica |

## 6. Circuito integrado

**Login → Home → Detalle → Sala → Puja → Confirmación**

1. Login contra `POST /api/auth/login`
2. Listado desde `GET /api/auctions`
3. Detalle desde `GET /api/auctions/:id`
4. Puja contra `POST /api/auctions/:id/bids` (requiere JWT)
5. Actualización periódica en sala (polling 3 s)

Usuario demo: `demo@lote.com` / `123456`
