const db = require('../config/db');
const { sendKycApprovedEmail } = require('../services/emailService');

const listPendingKyc = async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT c.identificador AS cliente_id, p.nombre, p.apellido, p.direccion, p.documento,
              c.admitido, c.categoria, u.email, u.id AS usuario_id,
              df.ruta AS dni_frente, dd.ruta AS dni_dorso
       FROM clientes c
       JOIN personas p ON p.identificador = c.identificador
       JOIN usuarios_app u ON u.cliente_id = c.identificador
       LEFT JOIN documentos_cliente df ON df.cliente_id = c.identificador AND df.tipo = 'dni_frente'
       LEFT JOIN documentos_cliente dd ON dd.cliente_id = c.identificador AND dd.tipo = 'dni_dorso'
       WHERE c.admitido = 'no'
       ORDER BY c.identificador DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[admin.listPendingKyc]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const reviewKyc = async (req, res) => {
  const { admitido, categoria } = req.body;
  const clienteId = req.params.id;

  if (!['si', 'no'].includes(admitido)) {
    return res.status(422).json({ message: 'admitido debe ser si o no' });
  }

  try {
    await db.execute(
      `UPDATE clientes SET admitido = ?, categoria = COALESCE(?, categoria)
       WHERE identificador = ?`,
      [admitido, categoria || null, clienteId]
    );

    if (admitido === 'si') {
      const [users] = await db.execute(
        'SELECT email FROM usuarios_app WHERE cliente_id = ?',
        [clienteId]
      );
      if (users[0]?.email) {
        await sendKycApprovedEmail(users[0].email, categoria || 'comun');
      }
    }

    return res.json({ message: 'KYC actualizado', admitido, categoria });
  } catch (err) {
    console.error('[admin.reviewKyc]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const listPendingItems = async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.identificador AS id, p.titulo, p.descripcionCatalogo,
              p.descripcionCompleta, p.historia, p.estado_solicitud,
              pe.nombre, pe.apellido
       FROM productos p
       JOIN duenios d ON d.identificador = p.duenio
       JOIN personas pe ON pe.identificador = d.identificador
       WHERE p.estado_solicitud = 'en_revision'
       ORDER BY p.identificador DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[admin.listPendingItems]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const reviewItem = async (req, res) => {
  const {
    estado_solicitud, motivo_rechazo, precio_base, comision,
    subasta_id, deposito_ubicacion,
  } = req.body;

  if (!['aceptado', 'rechazado'].includes(estado_solicitud)) {
    return res.status(422).json({ message: 'estado_solicitud inválido' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE productos SET
         estado_solicitud = ?,
         motivo_rechazo = ?,
         subasta_asignada_id = ?,
         deposito_ubicacion = COALESCE(?, deposito_ubicacion),
         disponible = ?
       WHERE identificador = ?`,
      [
        estado_solicitud,
        motivo_rechazo || null,
        subasta_id || null,
        deposito_ubicacion || null,
        estado_solicitud === 'aceptado' ? 'si' : 'no',
        req.params.id,
      ]
    );

    if (estado_solicitud === 'aceptado' && precio_base && comision && subasta_id) {
      const [emp] = await conn.execute(
        'SELECT identificador FROM empleados ORDER BY identificador LIMIT 1'
      );
      const [cat] = await conn.execute(
        'SELECT identificador FROM catalogos WHERE subasta = ? LIMIT 1',
        [subasta_id]
      );
      let catalogoId = cat[0]?.identificador;
      if (!catalogoId) {
        const [ins] = await conn.execute(
          'INSERT INTO catalogos (descripcion, subasta, responsable) VALUES (?, ?, ?)',
          [`Catálogo subasta ${subasta_id}`, subasta_id, emp[0].identificador]
        );
        catalogoId = ins.insertId;
      }

      await conn.execute(
        `INSERT INTO itemsCatalogo (catalogo, producto, precioBase, comision, subastado)
         VALUES (?, ?, ?, ?, 'no')`,
        [catalogoId, req.params.id, precio_base, comision]
      );
    }

    await conn.commit();
    return res.json({ message: 'Artículo revisado', estado_solicitud });
  } catch (err) {
    await conn.rollback();
    console.error('[admin.reviewItem]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    conn.release();
  }
};

const verifyPaymentMethod = async (req, res) => {
  const { verificado } = req.body;
  try {
    await db.execute(
      'UPDATE medios_pago SET verificado = ? WHERE id = ?',
      [verificado ? 1 : 0, req.params.id]
    );
    return res.json({ message: 'Medio de pago actualizado' });
  } catch (err) {
    console.error('[admin.verifyPaymentMethod]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const listPendingPaymentMethods = async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT mp.id, mp.tipo, mp.label, mp.currency, mp.monto_reservado, mp.verificado,
              u.email, u.id AS usuario_id,
              pe.nombre, pe.apellido, c.identificador AS cliente_id
       FROM medios_pago mp
       JOIN usuarios_app u ON u.id = mp.usuario_id
       LEFT JOIN clientes c ON c.identificador = u.cliente_id
       LEFT JOIN personas pe ON pe.identificador = c.identificador
       WHERE mp.is_active = 1 AND mp.verificado = 0
       ORDER BY mp.created_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[admin.listPendingPaymentMethods]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const listOpenSubastas = async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT identificador AS id, nombre, categoria, fecha, hora, moneda, ubicacion
       FROM subastas
       WHERE estado = 'abierta'
       ORDER BY fecha ASC, hora ASC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[admin.listOpenSubastas]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  listPendingKyc,
  reviewKyc,
  listPendingItems,
  reviewItem,
  verifyPaymentMethod,
  listPendingPaymentMethods,
  listOpenSubastas,
};
