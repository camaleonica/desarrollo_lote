const db = require('../config/db');
const { requireCliente } = require('../utils/userContext');

const list = async (req, res) => {
  try {
    const usuario = await requireCliente(req.user.id);

    const [rows] = await db.execute(
      `SELECT id, monto, descripcion, fecha_limite, pagada, created_at
       FROM multas
       WHERE cliente_id = ?
       ORDER BY pagada ASC, fecha_limite ASC`,
      [usuario.cliente_id]
    );

    return res.json(rows.map((row) => ({
      id: row.id,
      monto: Number(row.monto),
      descripcion: row.descripcion,
      fecha_limite: row.fecha_limite,
      pagada: Boolean(row.pagada),
      estado: row.pagada ? 'Pagada' : 'Pendiente',
    })));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('[fines.list]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const pay = async (req, res) => {
  const { medio_pago_id } = req.body;

  try {
    const usuario = await requireCliente(req.user.id);

    const [multas] = await db.execute(
      'SELECT * FROM multas WHERE id = ? AND cliente_id = ? AND pagada = 0',
      [req.params.id, usuario.cliente_id]
    );

    if (multas.length === 0) {
      return res.status(404).json({ message: 'Multa no encontrada o ya pagada' });
    }

    if (medio_pago_id) {
      const [pm] = await db.execute(
        'SELECT id FROM medios_pago WHERE id = ? AND usuario_id = ? AND is_active = 1',
        [medio_pago_id, req.user.id]
      );
      if (pm.length === 0) {
        return res.status(404).json({ message: 'Medio de pago no encontrado' });
      }
    }

    await db.execute('UPDATE multas SET pagada = 1 WHERE id = ?', [req.params.id]);

    const [pendientes] = await db.execute(
      'SELECT COUNT(*) AS total FROM multas WHERE cliente_id = ? AND pagada = 0',
      [usuario.cliente_id]
    );
    if (Number(pendientes[0].total) === 0) {
      await db.execute(
        "UPDATE usuarios_app SET status = 'verified' WHERE cliente_id = ? AND status = 'blocked'",
        [usuario.cliente_id]
      );
    }

    return res.json({
      message: 'Multa pagada correctamente',
      multa: { id: multas[0].id, monto: Number(multas[0].monto), pagada: true },
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('[fines.pay]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { list, pay };
