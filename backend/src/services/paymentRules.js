const db = require('../config/db');

async function getMedioPagoDefault(usuarioId) {
  const [rows] = await db.execute(
    `SELECT mp.*
     FROM usuarios_app u
     JOIN medios_pago mp ON mp.id = u.medio_pago_default_id
     WHERE u.id = ? AND mp.is_active = 1`,
    [usuarioId]
  );
  return rows[0] || null;
}

async function getCompromisoCheque(usuarioId) {
  const [rows] = await db.execute(
    `SELECT COALESCE(SUM(r.importe + r.comision), 0) AS comprometido
     FROM registroDeSubasta r
     JOIN usuarios_app u ON u.cliente_id = r.cliente
     WHERE u.id = ? AND r.pagado = 0`,
    [usuarioId]
  );
  return Number(rows[0]?.comprometido || 0);
}

async function validarMedioParaPuja(usuarioId, montoPuja, monedaSubasta) {
  const medio = await getMedioPagoDefault(usuarioId);
  if (!medio) {
    return { ok: false, message: 'Definí una forma de pago predeterminada en tu perfil' };
  }

  if (medio.currency !== monedaSubasta) {
    return {
      ok: false,
      message: `La subasta es en ${monedaSubasta}. Tu medio de pago es ${medio.currency}.`,
    };
  }

  if (medio.tipo === 'certified_check') {
    if (!medio.verificado) {
      return { ok: false, message: 'Tu cheque certificado aún no fue verificado por la empresa' };
    }
    const reservado = Number(medio.monto_reservado || 0);
    const comprometido = await getCompromisoCheque(usuarioId);
    if (comprometido + Number(montoPuja) > reservado) {
      return {
        ok: false,
        message: `El cheque certificado cubre hasta ${reservado}. Comprometido: ${comprometido}.`,
        disponible: Math.max(0, reservado - comprometido),
      };
    }
  }

  return { ok: true, medio };
}

module.exports = {
  getMedioPagoDefault,
  getCompromisoCheque,
  validarMedioParaPuja,
};
