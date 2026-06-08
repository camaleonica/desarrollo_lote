const db   = require('../config/db');
const path = require('path');

/**
 * GET /users/me
 * Retorna el perfil completo del usuario autenticado
 */
const getMe = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
         u.id, u.email, u.status, u.created_at,
         p.first_name, p.last_name, p.legal_address, p.country,
         p.dni_front_path, p.dni_back_path, p.kyc_status
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.json({ user: rows[0] });
  } catch (err) {
    console.error('[getMe]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /users/me/kyc
 * Body (multipart/form-data):
 *   first_name, last_name, legal_address, country
 *   dni_front (archivo), dni_back (archivo)
 *
 * Crea o actualiza el perfil KYC del usuario.
 */
const submitKyc = async (req, res) => {
  const { first_name, last_name, legal_address, country } = req.body;
  const userId = req.user.id;

  // Rutas de los archivos subidos (opcionales en re-envíos parciales)
  const dniFrontPath = req.files?.dni_front?.[0]?.filename
    ? `uploads/dni/${req.files.dni_front[0].filename}`
    : null;
  const dniBackPath = req.files?.dni_back?.[0]?.filename
    ? `uploads/dni/${req.files.dni_back[0].filename}`
    : null;

  try {
    // Verificar si ya existe un perfil
    const [existing] = await db.execute(
      'SELECT id FROM user_profiles WHERE user_id = ?', [userId]
    );

    if (existing.length === 0) {
      // Crear perfil nuevo
      await db.execute(
        `INSERT INTO user_profiles
           (user_id, first_name, last_name, legal_address, country,
            dni_front_path, dni_back_path, kyc_status, kyc_submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', NOW())`,
        [userId, first_name, last_name, legal_address, country || 'Argentina',
         dniFrontPath, dniBackPath]
      );
    } else {
      // Actualizar perfil existente (solo sobreescribe campos enviados)
      await db.execute(
        `UPDATE user_profiles SET
           first_name       = COALESCE(?, first_name),
           last_name        = COALESCE(?, last_name),
           legal_address    = COALESCE(?, legal_address),
           country          = COALESCE(?, country),
           dni_front_path   = COALESCE(?, dni_front_path),
           dni_back_path    = COALESCE(?, dni_back_path),
           kyc_status       = 'submitted',
           kyc_submitted_at = NOW()
         WHERE user_id = ?`,
        [first_name, last_name, legal_address, country,
         dniFrontPath, dniBackPath, userId]
      );
    }

    return res.json({
      message: 'Verificación enviada. El proceso puede demorar hasta 24h.',
      kyc_status: 'submitted',
    });
  } catch (err) {
    console.error('[submitKyc]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { getMe, submitKyc };
