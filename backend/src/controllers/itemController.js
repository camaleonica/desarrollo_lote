const db = require('../config/db');
const { requireCliente } = require('../utils/userContext');
const { MAX_PHOTOS } = require('../config/multerProducts');

const ESTADO_MAP = {
  en_revision: 'revision',
  aceptado: 'aceptado',
  rechazado: 'rechazado',
};

async function ensureDuenio(clienteId, conn) {
  const dbConn = conn || db;
  const [exists] = await dbConn.execute(
    'SELECT identificador FROM duenios WHERE identificador = ?',
    [clienteId]
  );
  if (exists.length) return clienteId;

  const [verificador] = await dbConn.execute(
    'SELECT identificador FROM empleados ORDER BY identificador LIMIT 1'
  );

  await dbConn.execute(
    `INSERT INTO duenios (identificador, verificacionFinanciera, verificacionJudicial, calificacionRiesgo, verificador)
     VALUES (?, 'no', 'no', 3, ?)`,
    [clienteId, verificador[0]?.identificador || 1]
  );
  return clienteId;
}

async function getProductPhotos(productoId) {
  const [rows] = await db.execute(
    'SELECT identificador, ruta, orden FROM fotos WHERE producto = ? ORDER BY orden',
    [productoId]
  );
  return rows.map((row) => ({
    id: row.identificador,
    url: row.ruta ? `/${row.ruta.replace(/\\/g, '/')}` : null,
    orden: row.orden,
  }));
}

const list = async (req, res) => {
  try {
    const usuario = await requireCliente(req.user.id);
    const [rows] = await db.execute(
      `SELECT p.identificador AS id, p.titulo, p.descripcionCatalogo AS descripcion,
              p.estado_solicitud, p.motivo_rechazo, p.subasta_asignada_id,
              p.deposito_ubicacion, p.seguro,
              s.nombre AS subasta_nombre, s.fecha AS subasta_fecha, s.hora AS subasta_hora,
              s.ubicacion AS subasta_ubicacion,
              ic.precioBase, ic.comision
       FROM productos p
       LEFT JOIN subastas s ON s.identificador = p.subasta_asignada_id
       LEFT JOIN itemsCatalogo ic ON ic.producto = p.identificador
       WHERE p.duenio = ?
       ORDER BY p.identificador DESC`,
      [usuario.cliente_id]
    );

    const items = await Promise.all(rows.map(async (row) => ({
      id: row.id,
      titulo: row.titulo || row.descripcion,
      descripcion: row.descripcion,
      categoria: 'General',
      estado: ESTADO_MAP[row.estado_solicitud] || row.estado_solicitud,
      motivo_rechazo: row.motivo_rechazo,
      deposito_ubicacion: row.deposito_ubicacion,
      seguro: row.seguro,
      fotos: await getProductPhotos(row.id),
      subasta: row.subasta_asignada_id
        ? {
            id: row.subasta_asignada_id,
            nombre: row.subasta_nombre,
            fecha: row.subasta_fecha,
            hora: row.subasta_hora,
            ubicacion: row.subasta_ubicacion,
            precio_base: row.precioBase,
            comision: row.comision,
          }
        : null,
    })));

    return res.json(items);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('[items.list]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const create = async (req, res) => {
  const {
    titulo,
    descripcion,
    historia,
    datos_relevantes,
    categoria,
    declaracion_legal,
  } = req.body;

  if (declaracion_legal === 'false' || declaracion_legal === false) {
    return res.status(422).json({ message: 'Debés aceptar la declaración legal' });
  }

  const photos = req.files || [];
  if (photos.length < MAX_PHOTOS) {
    return res.status(422).json({
      message: `Debés subir al menos ${MAX_PHOTOS} fotos del artículo`,
      required: MAX_PHOTOS,
      received: photos.length,
    });
  }

  const conn = await db.getConnection();

  try {
    const usuario = await requireCliente(req.user.id);
    await conn.beginTransaction();

    const duenioId = await ensureDuenio(usuario.cliente_id, conn);
    const [revisor] = await conn.execute(
      'SELECT identificador FROM empleados ORDER BY identificador LIMIT 1'
    );

    const descripcionCatalogo = (descripcion || titulo || '').slice(0, 500);
    const descripcionCompleta = (descripcion || titulo || 'Sin descripción').slice(0, 300);

    const [result] = await conn.execute(
      `INSERT INTO productos (
         titulo, fecha, disponible, descripcionCatalogo, descripcionCompleta,
         historia, datos_relevantes, estado_solicitud, declaracion_legal,
         revisor, duenio
       ) VALUES (?, CURDATE(), 'no', ?, ?, ?, ?, 'en_revision', 1, ?, ?)`,
      [
        titulo || descripcionCatalogo,
        descripcionCatalogo,
        descripcionCompleta,
        historia || null,
        datos_relevantes || categoria || null,
        revisor[0]?.identificador || 1,
        duenioId,
      ]
    );

    const productoId = result.insertId;
    for (let i = 0; i < photos.length; i += 1) {
      const ruta = `uploads/products/${photos[i].filename}`;
      await conn.execute(
        'INSERT INTO fotos (producto, ruta, orden) VALUES (?, ?, ?)',
        [productoId, ruta, i + 1]
      );
    }

    await conn.commit();

    return res.status(201).json({
      message: 'Solicitud enviada. Quedó en revisión.',
      item: { id: productoId, titulo: titulo || descripcionCatalogo, estado: 'revision' },
    });
  } catch (err) {
    await conn.rollback();
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('[items.create]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    conn.release();
  }
};

const getTracking = async (req, res) => {
  try {
    const usuario = await requireCliente(req.user.id);
    const [rows] = await db.execute(
      `SELECT p.identificador AS id, p.titulo, p.deposito_ubicacion, p.seguro,
              sg.compania, sg.importe AS seguro_importe, sg.nroPoliza
       FROM productos p
       LEFT JOIN seguros sg ON sg.nroPoliza = p.seguro
       WHERE p.identificador = ? AND p.duenio = ?`,
      [req.params.id, usuario.cliente_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Artículo no encontrado' });
    }

    const item = rows[0];
    return res.json({
      id: item.id,
      titulo: item.titulo,
      ubicacion_deposito: item.deposito_ubicacion || 'Depósito central Loté — pendiente de asignación',
      seguro: item.seguro
        ? {
            poliza: item.nroPoliza,
            compania: item.compania,
            importe: Number(item.seguro_importe),
          }
        : null,
      fotos: await getProductPhotos(item.id),
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('[items.getTracking]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const respondConditions = async (req, res) => {
  const { acepta } = req.body;

  try {
    const usuario = await requireCliente(req.user.id);
    const [rows] = await db.execute(
      `SELECT identificador, estado_solicitud FROM productos
       WHERE identificador = ? AND duenio = ?`,
      [req.params.id, usuario.cliente_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Artículo no encontrado' });
    }
    if (rows[0].estado_solicitud !== 'aceptado') {
      return res.status(422).json({ message: 'Solo podés responder condiciones de artículos aceptados' });
    }

    if (acepta) {
      await db.execute("UPDATE productos SET disponible = 'si' WHERE identificador = ?", [req.params.id]);
      return res.json({ message: 'Condiciones aceptadas. El artículo será incluido en la subasta.' });
    }

    await db.execute(
      `UPDATE productos SET estado_solicitud = 'rechazado',
         motivo_rechazo = 'Condiciones rechazadas por el dueño'
       WHERE identificador = ?`,
      [req.params.id]
    );
    return res.json({ message: 'Condiciones rechazadas. Se coordinará la devolución.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('[items.respondConditions]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { list, create, getTracking, respondConditions, getProductPhotos };
