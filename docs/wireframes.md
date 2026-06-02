# Wireframes — App de Subastas (ACTUALIZADO)

Referencia funcional acordada con Figma. IDs `WF-XX` usados en código y documentación.

---

## FLUJO 1 — Autenticación

### WF-01 · Splash

**Contenido:** Logo centrado, nombre de la empresa, indicador de carga.

**Navega hacia:** WF-02 Login (automático al terminar carga).

---

### WF-02 · Login

**Contenido:** Email, contraseña, botón Ingresar, links Registrate / Olvidaste contraseña.

**Navega hacia:**
- WF-06 Home — login OK
- WF-03 Registro paso 1 — Registrate
- WF-05c Recuperar contraseña

---

### WF-03 · Registro Paso 1

**Contenido:** Nombre, apellido, domicilio legal, país de origen, upload DNI frente/dorso, Continuar.

**Navega hacia:** WF-04 Registro paso 2.

---

### WF-04 · Registro Paso 2

**Contenido:** Texto explicativo, contraseña provisoria, nueva contraseña, confirmar, Guardar y continuar, nota sobre medio de pago.

**Navega hacia:** WF-05a Medios de pago — lista.

---

### WF-05a · Medios de Pago — Lista

**Contenido:** Lista (tipo, moneda, estado), Agregar medio, eliminar por ítem.

**Navega hacia:** WF-05b, WF-06 Home, WF-16 Perfil.

---

### WF-05b · Agregar Medio de Pago

**Contenido:** Tipo (cuenta / tarjeta), moneda (pesos / dólares), campos dinámicos, Guardar / Cancelar.

**Navega hacia:** WF-05a.

---

### WF-05c · Recuperar Contraseña

**Contenido:** Email, Enviar, Volver al login.

**Navega hacia:** WF-02 Login.

---

## FLUJO 2 — Subastas

### WF-06 · Home — Lista de Subastas

**Contenido:** Header usuario + categoría, lista (nombre, categoría, fecha/hora, moneda, estado), bloqueo visual si categoría insuficiente, bottom nav (Subastas, Mis Pujas, Mis Artículos, Perfil).

**Navega hacia:** WF-07, WF-12, WF-14, WF-16.

---

### WF-07 · Detalle de Subasta / Catálogo

**Contenido:** Info subasta (fecha, hora, lugar, rematador, moneda), lista de piezas (número, miniatura, descripción, precio base), Ingresar a la subasta.

**Condiciones:** Medio de pago, categoría suficiente, forma de pago en perfil.

**Navega hacia:** WF-08, WF-09, WF-06.

---

### WF-08 · Detalle de Pieza

**Contenido:** Galería, número, descripción, precio base, info adicional.

**Navega hacia:** WF-07.

---

### WF-09 · Sala de Subasta (en vivo)

**Contenido:** Pieza actual, mejor oferta en tiempo real, monto de puja, Pujar, link streaming, timer de cierre, mensaje conexión simultánea.

**Cambios:** Sin historial de pujas; timer visible.

**Navega hacia:** WF-11, WF-06.

---

### WF-11 · Pieza Ganada — Resumen de Compra

**Contenido:** Detalle pieza, monto final, comisiones, forma de pago, entrega (envío / retiro), Finalizar compra.

**Navega hacia:** WF-11b, WF-09, WF-06.

---

### WF-11b · Confirmación de Entrega

**Contenido:** Método envío/retiro, estado, datos.

**Navega hacia:** WF-06 Home.

---

## FLUJO 3 — Mis Actividades

### WF-12 · Mis Pujas

**Contenido:** Lista participaciones (resultado, importe, estado), métricas (asistidas, ganadas, total ofertado, total pagado).

**Cambios:** Sin historial detallado de pujas.

**Navega hacia:** WF-13, WF-06, WF-14, WF-16.

---

### WF-13 · Estado de Cuenta / Multas

**Contenido:** Multas pendientes (monto, descripción, fecha límite), Pagar multa.

**Navega hacia:** WF-12, WF-05a.

---

## FLUJO 4 — Mis Artículos

### WF-14 · Solicitud de Artículo para Subasta

**Contenido:** Descripción, historia, datos relevantes, upload fotos, checkbox legal, Enviar solicitud.

**Navega hacia:** WF-15.

---

### WF-15 · Estado de Mis Artículos

**Contenido:** Lista artículos, estados (revisión / aceptado / rechazado), subasta asignada, aceptar/rechazar condiciones, agregar nuevo.

**Navega hacia:** WF-14, WF-06, WF-12, WF-16.

---

## FLUJO 5 — Perfil

### WF-16 · Perfil

**Contenido:** Datos personales, categoría, medios de pago, forma de pago predeterminada, cuenta cobro, notificaciones, Cerrar sesión.

**Navega hacia:** WF-05a, WF-02, WF-06, WF-12, WF-14.
