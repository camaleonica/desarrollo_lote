const db = require('../config/db');
const { requireCliente, getUsuarioConCliente } = require('../utils/userContext');

const finalize = async (req, res) => {
  const subastaId = req.params.id;
  const {
    item_id: itemId,
    monto,
    metodo_entrega,
    medio_pago_id,
    direccion_entrega,
  } = req.body;

  const conn = await db.getConnection();

  try {
    const usuario = await requireCliente(req.user.id);
    await conn.beginTransaction();

    const [subastaRows] = await conn.execute(
      'SELECT identificador, pieza_actual_id FROM subastas WHERE identificador = ?',
      [subastaId]
    );
    if (subastaRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Subasta no encontrada' });
    }

    const resolvedItemId = itemId || subastaRows[0].pieza_actual_id;

    const [itemRows] = await conn.execute(
      `SELECT ic.identificador, ic.precioBase, ic.comision, ic.producto, p.duenio
       FROM itemsCatalogo ic
       JOIN catalogos c ON c.identificador = ic.catalogo
       JOIN productos p ON p.identificador = ic.producto
       WHERE ic.identificador = ? AND c.subasta = ?`,
      [resolvedItemId, subastaId]
    );

    if (itemRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Pieza no encontrada en la subasta' });
    }

    const item = itemRows[0];
    const importe = Number(monto) || Number(item.precioBase);
    const comision = Number(item.comision);

    const [asistenteRows] = await conn.execute(
      'SELECT identificador FROM asistentes WHERE cliente = ? AND subasta = ?',
      [usuario.cliente_id, subastaId]
    );
    if (asistenteRows.length === 0) {
      await conn.rollback();
      return res.status(403).json({ message: 'No participaste en esta subasta' });
    }

    let medioPagoId = medio_pago_id;
    if (!medioPagoId) {
      const [userRow] = await conn.execute(
        'SELECT medio_pago_default_id FROM usuarios_app WHERE id = ?',
        [req.user.id]
      );
      medioPagoId = userRow[0]?.medio_pago_default_id;
    }

    if (!medioPagoId) {
      await conn.rollback();
      return res.status(422).json({ message: 'Seleccioná un medio de pago' });
    }

    const [pm] = await conn.execute(
      'SELECT id FROM medios_pago WHERE id = ? AND usuario_id = ? AND is_active = 1',
      [medioPagoId, req.user.id]
    );
    if (pm.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Medio de pago no válido' });
    }

    const metodoEntrega = metodo_entrega === 'retiro' ? 'retiro' : 'envio';
    const direccion = metodoEntrega === 'envio'
      ? (direccion_entrega || usuario.direccion)
      : null;

    await conn.execute(
      "UPDATE pujos SET ganador = 'no' WHERE item = ?",
      [resolvedItemId]
    );

    await conn.execute(
      `UPDATE pujos SET ganador = 'si'
       WHERE identificador = (
         SELECT id FROM (
           SELECT identificador AS id FROM pujos
           WHERE item = ? AND asistente = ?
           ORDER BY importe DESC, identificador DESC
           LIMIT 1
         ) AS t
       )`,
      [resolvedItemId, asistenteRows[0].identificador]
    );

    const [registro] = await conn.execute(
      `INSERT INTO registroDeSubasta (
         subasta, duenio, producto, cliente, importe, comision,
         medio_pago_id, metodo_entrega, estado_entrega, direccion_entrega,
         pagado, fecha_limite_pago
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, 0, DATE_ADD(NOW(), INTERVAL 72 HOUR))`,
      [
        subastaId, item.duenio, item.producto, usuario.cliente_id,
        importe, comision, medioPagoId, metodoEntrega, direccion,
      ]
    );

    await conn.execute(
      "UPDATE itemsCatalogo SET subastado = 'si' WHERE identificador = ?",
      [resolvedItemId]
    );

    await conn.commit();

    return res.status(201).json({
      message: 'Compra registrada correctamente',
      purchase: {
        id: registro.insertId,
        subasta_id: Number(subastaId),
        item_id: resolvedItemId,
        importe,
        comision,
        total: importe + comision,
        metodo_entrega: metodoEntrega,
        estado_entrega: 'pendiente',
        direccion_entrega: direccion,
      },
    });
  } catch (err) {
    await conn.rollback();
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('[purchases.finalize]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    conn.release();
  }
};

const getDelivery = async (req, res) => {
  try {
    const usuario = await requireCliente(req.user.id);

    const [rows] = await db.execute(
      `SELECT r.identificador AS id, r.metodo_entrega, r.estado_entrega,
              r.direccion_entrega, r.importe, r.comision, r.pagado,
              p.titulo, s.nombre AS subasta_nombre, s.ubicacion
       FROM registroDeSubasta r
       JOIN productos p ON p.identificador = r.producto
       JOIN subastas s ON s.identificador = r.subasta
       WHERE r.identificador = ? AND r.cliente = ?`,
      [req.params.id, usuario.cliente_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Compra no encontrada' });
    }

    const row = rows[0];
    const metodoLabel = row.metodo_entrega === 'retiro' ? 'Retiro presencial' : 'Envío a domicilio';

    return res.json({
      id: row.id,
      titulo: row.titulo,
      subasta: row.subasta_nombre,
      metodo_entrega: row.metodo_entrega,
      metodo_label: metodoLabel,
      estado_entrega: row.estado_entrega,
      estado_label: {
        pendiente: 'Pendiente',
        en_camino: 'En camino',
        entregado: 'Entregado',
        retirado: 'Retirado',
      }[row.estado_entrega] || row.estado_entrega,
      direccion_entrega: row.direccion_entrega,
      retiro_ubicacion: row.metodo_entrega === 'retiro' ? row.ubicacion : null,
      importe: Number(row.importe),
      comision: Number(row.comision),
      total: Number(row.importe) + Number(row.comision),
      pagado: Boolean(row.pagado),
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('[purchases.getDelivery]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const listMine = async (req, res) => {
  try {
    const usuario = await getUsuarioConCliente(req.user.id);
    if (!usuario?.cliente_id) {
      return res.json([]);
    }

    const [rows] = await db.execute(
      `SELECT r.identificador AS id, r.metodo_entrega, r.estado_entrega,
              r.importe, r.comision, p.titulo, s.nombre AS subasta
       FROM registroDeSubasta r
       JOIN productos p ON p.identificador = r.producto
       JOIN subastas s ON s.identificador = r.subasta
       WHERE r.cliente = ?
       ORDER BY r.identificador DESC`,
      [usuario.cliente_id]
    );

    return res.json(rows.map((row) => ({
      id: row.id,
      titulo: row.titulo,
      subasta: row.subasta,
      metodo_entrega: row.metodo_entrega,
      estado_entrega: row.estado_entrega,
      total: Number(row.importe) + Number(row.comision),
    })));
  } catch (err) {
    console.error('[purchases.listMine]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { finalize, getDelivery, listMine };
