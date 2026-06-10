const db = require('../config/db');

/**
 * Cierra subastas vencidas. Si una pieza no tuvo pujas, la empresa la compra al precio base (TPO).
 */
async function cerrarSubastasVencidas() {
  const [subastas] = await db.execute(
    `SELECT identificador, pieza_actual_id FROM subastas
     WHERE estado = 'abierta' AND fecha_cierre IS NOT NULL AND fecha_cierre <= NOW()`
  );

  for (const subasta of subastas) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [items] = await conn.execute(
        `SELECT ic.identificador, ic.precioBase, ic.comision, ic.subastado, p.duenio, ic.producto
         FROM catalogos c
         JOIN itemsCatalogo ic ON ic.catalogo = c.identificador
         JOIN productos p ON p.identificador = ic.producto
         WHERE c.subasta = ?`,
        [subasta.identificador]
      );

      for (const item of items) {
        if (item.subastado === 'si') continue;

        const [pujas] = await conn.execute(
          'SELECT COUNT(*) AS total FROM pujos WHERE item = ?',
          [item.identificador]
        );

        if (Number(pujas[0].total) === 0) {
          const [empresa] = await conn.execute(
            'SELECT identificador FROM clientes WHERE identificador = 99 LIMIT 1'
          );
          const compradorId = empresa[0]?.identificador;
          if (compradorId) {
            await conn.execute(
              `INSERT INTO registroDeSubasta (
                 subasta, duenio, producto, cliente, importe, comision,
                 pagado, fecha_limite_pago, metodo_entrega, estado_entrega
               ) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), 'retiro', 'retirado')`,
              [
                subasta.identificador,
                item.duenio,
                item.producto,
                compradorId,
                item.precioBase,
                item.comision,
              ]
            );
          }
        }

        await conn.execute(
          "UPDATE itemsCatalogo SET subastado = 'si' WHERE identificador = ?",
          [item.identificador]
        );
      }

      await conn.execute(
        "UPDATE subastas SET estado = 'cerrada' WHERE identificador = ?",
        [subasta.identificador]
      );

      await conn.commit();
      console.log(`[auctions] Subasta ${subasta.identificador} cerrada`);
    } catch (err) {
      await conn.rollback();
      console.error(`[auctions] Error cerrando subasta ${subasta.identificador}`, err);
    } finally {
      conn.release();
    }
  }

  return subastas.length;
}

module.exports = { cerrarSubastasVencidas };
