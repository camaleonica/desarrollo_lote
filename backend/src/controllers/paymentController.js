const db = require('../config/db');

const list = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, tipo, label, currency, card_brand, card_last4,
              bank_name, account_number, monto_reservado, verificado, is_active
       FROM medios_pago
       WHERE usuario_id = ? AND is_active = 1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    const payment_methods = rows.map((row) => ({
      ...row,
      status: row.is_active ? 'activo' : 'inactivo',
    }));
    return res.json({ payment_methods });
  } catch (err) {
    console.error('[list payments]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const create = async (req, res) => {
  const {
    type, currency,
    card_brand, card_last4, card_exp_month, card_exp_year,
    bank_name, account_number, monto_reservado,
  } = req.body;

  let label = '';
  if (type === 'credit_card') {
    label = `${card_brand || 'Tarjeta'} ****${card_last4 || ''}`;
  } else if (type === 'bank_account') {
    label = `${bank_name || 'Banco'} - ${account_number || ''}`;
  } else if (type === 'certified_check') {
    label = `Cheque certificado ${currency || 'ARS'} ${monto_reservado || ''}`;
  }

  try {
    const verificado = type === 'certified_check' ? 0 : 1;
    const [result] = await db.execute(
      `INSERT INTO medios_pago
         (usuario_id, tipo, label, currency, card_brand, card_last4,
          bank_name, account_number, monto_reservado, verificado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, type, label, currency || 'ARS',
        card_brand || null, card_last4 || null,
        bank_name || null, account_number || null,
        monto_reservado || null,
        verificado,
      ]
    );

    const [countRows] = await db.execute(
      'SELECT COUNT(*) AS total FROM medios_pago WHERE usuario_id = ? AND is_active = 1',
      [req.user.id]
    );
    if (countRows[0].total === 1) {
      await db.execute(
        'UPDATE usuarios_app SET medio_pago_default_id = ? WHERE id = ?',
        [result.insertId, req.user.id]
      );
    }

    return res.status(201).json({
      message: type === 'certified_check'
        ? 'Cheque registrado. Quedará pendiente de verificación presencial.'
        : 'Medio de pago agregado',
      payment_method: {
        id: result.insertId,
        type,
        label,
        currency: currency || 'ARS',
        status: verificado ? 'activo' : 'pendiente',
      },
    });
  } catch (err) {
    console.error('[create payment]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const remove = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.execute(
      'UPDATE medios_pago SET is_active = 0 WHERE id = ? AND usuario_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Medio de pago no encontrado' });
    }

    await db.execute(
      `UPDATE usuarios_app SET medio_pago_default_id = NULL
       WHERE id = ? AND medio_pago_default_id = ?`,
      [req.user.id, id]
    );

    return res.json({ message: 'Medio de pago eliminado' });
  } catch (err) {
    console.error('[remove payment]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { list, create, remove };
