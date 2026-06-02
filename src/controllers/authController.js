const bcrypt  = require('bcryptjs');
const db      = require('../config/db');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  refreshExpiresAt,
} = require('../utils/jwt');

// ─── Helpers ────────────────────────────────────────────────

const issueTokens = async (user) => {
  const payload      = { id: user.id, email: user.email };
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  const expiresAt    = refreshExpiresAt();

  await db.execute(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [user.id, refreshToken, expiresAt]
  );

  return { accessToken, refreshToken };
};

// ─── Controllers ────────────────────────────────────────────

/**
 * POST /auth/register
 * Body: { email, password }
 */
const register = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verificar si el email ya existe
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const [result] = await db.execute(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );

    const user = { id: result.insertId, email };
    const { accessToken, refreshToken } = await issueTokens(user);

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      user: { id: user.id, email: user.email, status: 'pending' },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /auth/login
 * Body: { email, password }
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.execute(
      'SELECT id, email, password, status FROM users WHERE email = ?', [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Cuenta suspendida. Contactá soporte.' });
    }

    const { accessToken, refreshToken } = await issueTokens(user);

    return res.json({
      message: 'Sesión iniciada correctamente',
      user: { id: user.id, email: user.email, status: user.status },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /auth/refresh
 * Body: { refreshToken }
 */
const refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token requerido' });
  }

  try {
    // Verificar firma JWT
    const decoded = verifyRefreshToken(refreshToken);

    // Verificar que el token existe en DB y no expiró
    const [rows] = await db.execute(
      `SELECT id FROM refresh_tokens
       WHERE token = ? AND user_id = ? AND expires_at > NOW()`,
      [refreshToken, decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Refresh token inválido o expirado' });
    }

    // Rotar refresh token (invalidar el viejo, generar uno nuevo)
    await db.execute('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);

    const user = { id: decoded.id, email: decoded.email };
    const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user);

    return res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Refresh token inválido' });
    }
    console.error('[refresh]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /auth/logout
 * Header: Authorization: Bearer <accessToken>
 * Body: { refreshToken }
 */
const logout = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    if (refreshToken) {
      await db.execute(
        'DELETE FROM refresh_tokens WHERE token = ? AND user_id = ?',
        [refreshToken, req.user.id]
      );
    }
    return res.json({ message: 'Sesión cerrada correctamente' });
  } catch (err) {
    console.error('[logout]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { register, login, refresh, logout };
