const db = require('../config/db');
const { requireCliente } = require('../utils/userContext');
const { CATEGORIA_LABELS } = require('../utils/auctions');

const list = async (req, res) => {
  try {
    const usuario = await requireCliente(req.user.id);

    const [rows] = await db.execute(
      `SELECT s.identificador AS subasta_id, s.nombre, s.categoria, s.moneda, s.estado,
              ic.identificador AS item_id,
              p.titulo,
              ic.precioBase,
              MAX(pj.importe) AS mejor_oferta,
              MAX(CASE WHEN pj.asistente = a.identificador THEN pj.importe END) AS mi_mejor_puja,
              MAX(CASE WHEN pj.ganador = 'si' AND a.cliente = ? THEN 1 ELSE 0 END) AS gane
       FROM asistentes a
       JOIN subastas s ON s.identificador = a.subasta
       JOIN catalogos cat ON cat.subasta = s.identificador
       JOIN itemsCatalogo ic ON ic.catalogo = cat.identificador
       JOIN productos p ON p.identificador = ic.producto
       LEFT JOIN pujos pj ON pj.item = ic.identificador
       WHERE a.cliente = ?
       GROUP BY s.identificador, ic.identificador, s.nombre, s.categoria, s.moneda, s.estado, p.titulo, ic.precioBase
       ORDER BY s.fecha DESC`,
      [usuario.cliente_id, usuario.cliente_id]
    );

    const activities = rows.map((row) => {
      const miPuja = Number(row.mi_mejor_puja) || 0;
      const precioActual = Number(row.mejor_oferta) || Number(row.precioBase);
      let estado_puja = 'superada';

      if (row.gane) estado_puja = 'ganada';
      else if (miPuja > 0 && miPuja >= precioActual) estado_puja = 'ganando';
      else if (row.estado === 'cerrada' && miPuja > 0) estado_puja = 'perdida';

      return {
        id: `${row.subasta_id}-${row.item_id}`,
        subasta_id: row.subasta_id,
        item_id: row.item_id,
        titulo: row.titulo || row.nombre,
        categoria: CATEGORIA_LABELS[row.categoria] || row.categoria,
        moneda: row.moneda,
        mi_puja: miPuja,
        precio_actual: precioActual,
        resultado: row.gane ? 'Ganada' : 'Participó',
        importe_final: precioActual,
        estado: row.gane ? 'Ganada' : 'Finalizada',
        estado_puja,
      };
    });

    return res.json(activities);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('[activities.list]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const stats = async (req, res) => {
  try {
    const usuario = await requireCliente(req.user.id);

    const [asistidas] = await db.execute(
      'SELECT COUNT(DISTINCT subasta) AS total FROM asistentes WHERE cliente = ?',
      [usuario.cliente_id]
    );

    const [ganadas] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM registroDeSubasta
       WHERE cliente = ?`,
      [usuario.cliente_id]
    );

    const [ofertado] = await db.execute(
      `SELECT COALESCE(SUM(pj.importe), 0) AS total
       FROM pujos pj
       JOIN asistentes a ON a.identificador = pj.asistente
       WHERE a.cliente = ?`,
      [usuario.cliente_id]
    );

    const [pagado] = await db.execute(
      `SELECT COALESCE(SUM(importe + comision), 0) AS total
       FROM registroDeSubasta
       WHERE cliente = ? AND pagado = 1`,
      [usuario.cliente_id]
    );

    const totalPujasRows = await db.execute(
      `SELECT COUNT(*) AS total FROM pujos pj
       JOIN asistentes a ON a.identificador = pj.asistente
       WHERE a.cliente = ?`,
      [usuario.cliente_id]
    );

    const totalPujas = totalPujasRows[0][0]?.total || 0;
    const ganadasCount = ganadas[0]?.total || 0;
    const asistidasCount = asistidas[0]?.total || 0;

    return res.json({
      subastas_asistidas: asistidasCount,
      ganadas: ganadasCount,
      total_ofertado: Number(ofertado[0]?.total || 0),
      total_pagado: Number(pagado[0]?.total || 0),
      total_pujas: totalPujas,
      porcentaje_exito: asistidasCount
        ? Math.round((ganadasCount / asistidasCount) * 100)
        : 0,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('[activities.stats]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { list, stats };
