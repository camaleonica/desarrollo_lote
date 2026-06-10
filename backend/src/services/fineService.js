const db = require('../config/db');

async function crearMultaPorImpago({ clienteId, registroId, importe, descripcion }) {
  const monto = Math.round(Number(importe) * 0.1 * 100) / 100;
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() + 7);

  const [result] = await db.execute(
    `INSERT INTO multas (cliente_id, monto, descripcion, fecha_limite, registro_id)
     VALUES (?, ?, ?, ?, ?)`,
    [clienteId, monto, descripcion, fechaLimite, registroId]
  );

  await db.execute(
    `UPDATE usuarios_app SET status = 'blocked'
     WHERE cliente_id = ?`,
    [clienteId]
  );

  return { id: result.insertId, monto };
}

async function procesarImpagosVencidos() {
  const [registros] = await db.execute(
    `SELECT r.identificador, r.cliente, r.importe, r.fecha_limite_pago
     FROM registroDeSubasta r
     WHERE r.pagado = 0
       AND r.fecha_limite_pago IS NOT NULL
       AND r.fecha_limite_pago < NOW()
       AND NOT EXISTS (
         SELECT 1 FROM multas m
         WHERE m.registro_id = r.identificador AND m.pagada = 0
       )`
  );

  for (const reg of registros) {
    await crearMultaPorImpago({
      clienteId: reg.cliente,
      registroId: reg.identificador,
      importe: reg.importe,
      descripcion: `Multa 10% por impago de puja ganadora (registro #${reg.identificador})`,
    });
    console.log(`[fines] Multa generada para cliente ${reg.cliente}, registro ${reg.identificador}`);
  }

  return registros.length;
}

async function procesarMultasVencidas() {
  const [rows] = await db.execute(
    `SELECT DISTINCT m.cliente_id
     FROM multas m
     WHERE m.pagada = 0 AND m.fecha_limite < CURDATE()`
  );

  for (const row of rows) {
    await db.execute(
      `UPDATE usuarios_app SET status = 'blocked' WHERE cliente_id = ?`,
      [row.cliente_id]
    );
  }

  return rows.length;
}

async function runFineJobs() {
  const impagos = await procesarImpagosVencidos();
  const vencidas = await procesarMultasVencidas();
  return { impagos, multasVencidas: vencidas };
}

module.exports = {
  crearMultaPorImpago,
  procesarImpagosVencidos,
  procesarMultasVencidas,
  runFineJobs,
};
