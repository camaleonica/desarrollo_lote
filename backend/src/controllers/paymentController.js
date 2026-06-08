const db = require('../config/db');

/**
 * GET /payment-methods
 * Lista los medios de pago activos del usuario
 */
const list = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, type, label, currency, card_brand, card_last4,
              card_exp_month, card_exp_year, bank_name, account_number
       FROM payment_methods
       WHERE user_id = ? AND is_active = 1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ payment_methods: rows });
  } catch (err) {
    console.error('[list payments]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /payment-methods
 * Body: { type, currency, card_brand?, card_last4?, card_exp_month?,
 *         card_exp_year?, bank_name?, account_number? }
 */
const create = async (req, res) => {
  const {
    type, currency,
    card_brand, card_last4, card_exp_month, card_exp_year,
    bank_name, account_number,
  } = req.body;

  // Construir label legible
  let label = '';
  if (type === 'credit_card') {
    label = `${card_brand || 'Tarjeta'} ****${card_last4 || ''}`;
  } else if (type === 'bank_account') {
    label = `${bank_name || 'Banco'} - ${account_number || ''}`;
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO payment_methods
         (user_id, type, label, currency, card_brand, card_last4,
          card_exp_month, card_exp_year, bank_name, account_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, type, label, currency || 'ARS',
       card_brand || null, card_last4 || null,
       card_exp_month || null, card_exp_year || null,
       bank_name || null, account_number || null]
    );

    return res.status(201).json({
      message: 'Medio de pago agregado',
      payment_method: { id: result.insertId, type, label, currency },
    });
  } catch (err) {
    console.error('[create payment]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * DELETE /payment-methods/:id
 * Soft-delete (is_active = 0)
 */
const remove = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.execute(
      'UPDATE payment_methods SET is_active = 0 WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Medio de pago no encontrado' });
    }

    return res.json({ message: 'Medio de pago eliminado' });
  } catch (err) {
    console.error('[remove payment]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { list, create, remove };
