const bcrypt = require('bcryptjs');
const db = require('../config/db');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  refreshExpiresAt,
} = require('../utils/jwt');
const { generateProvisionalPassword } = require('../utils/password');
const { mapUserResponse, getUsuarioConCliente } = require('../utils/userContext');
const { sendProvisionalPasswordEmail, sendPasswordResetEmail, generateToken } = require('../services/emailService');

const issueTokens = async (user) => {
  const payload = { id: user.id, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  const expiresAt = refreshExpiresAt();

  await db.execute(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [user.id, refreshToken, expiresAt]
  );

  return { accessToken, refreshToken };
};

const register = async (req, res) => {
  const { email } = req.body;

  try {
    const [existing] = await db.execute(
      'SELECT id FROM usuarios_app WHERE email = ?',
      [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'El email ya está registrado', code: 'EMAIL_EXISTS' });
    }

    const provisionalPassword = generateProvisionalPassword();
    const hashedPassword = await bcrypt.hash(provisionalPassword, 12);

    const [result] = await db.execute(
      'INSERT INTO usuarios_app (email, password, status) VALUES (?, ?, ?)',
      [email, hashedPassword, 'pending']
    );

    const user = { id: result.insertId, email };
    const { accessToken, refreshToken } = await issueTokens(user);

    console.log(`[register] Contraseña provisoria para ${email}: ${provisionalPassword}`);
    await sendProvisionalPasswordEmail(email, provisionalPassword);

    return res.status(201).json({
      message: 'Cuenta creada. Usá la contraseña provisoria para definir tu contraseña definitiva.',
      user: { id: user.id, email: user.email, status: 'pending' },
      provisionalPassword,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;

  try {
    const [rows] = await db.execute(
      'SELECT id, email, password, status FROM usuarios_app WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = rows[0];
    const matches = await bcrypt.compare(current_password, user.password);
    if (!matches) {
      return res.status(401).json({ message: 'La contraseña provisoria no es correcta' });
    }

    if (current_password === new_password) {
      return res.status(422).json({ message: 'La nueva contraseña debe ser distinta a la provisoria' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 12);
    await db.execute(
      "UPDATE usuarios_app SET password = ?, status = 'verified' WHERE id = ?",
      [hashedPassword, user.id]
    );

    const profile = await getUsuarioConCliente(user.id);

    return res.json({
      message: 'Contraseña actualizada correctamente',
      user: mapUserResponse(profile || { id: user.id, email: user.email, status: 'verified' }),
    });
  } catch (err) {
    console.error('[changePassword]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.execute(
      'SELECT id, email, password, status FROM usuarios_app WHERE email = ?',
      [email]
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

    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Cuenta bloqueada por incumplimiento de pago.' });
    }

    const { accessToken, refreshToken } = await issueTokens(user);
    const profile = await getUsuarioConCliente(user.id);

    return res.json({
      message: 'Sesión iniciada correctamente',
      user: mapUserResponse(profile || user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token requerido' });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    const [rows] = await db.execute(
      `SELECT id FROM refresh_tokens
       WHERE token = ? AND user_id = ? AND expires_at > NOW()`,
      [refreshToken, decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Refresh token inválido o expirado' });
    }

    await db.execute('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);

    const user = { id: decoded.id, email: decoded.email };
    const tokens = await issueTokens(user);

    return res.json(tokens);
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Refresh token inválido' });
    }
    console.error('[refresh]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const logout = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    if (refreshToken) {
      await db.execute(
        'DELETE FROM refresh_tokens WHERE token = ? AND user_id = ?',
        [refreshToken, req.user.id]
      );
    }
    await db.execute(
      'UPDATE sesiones_subasta SET activa = 0 WHERE usuario_id = ? AND activa = 1',
      [req.user.id]
    );
    return res.json({ message: 'Sesión cerrada correctamente' });
  } catch (err) {
    console.error('[logout]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await db.execute('SELECT id FROM usuarios_app WHERE email = ?', [email]);
    if (rows.length > 0) {
      const token = generateToken();
      const expires = new Date();
      expires.setHours(expires.getHours() + 1);

      await db.execute(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [rows[0].id, token, expires]
      );
      await sendPasswordResetEmail(email, token);
    }
    return res.json({
      message:
        'Si el email está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.',
    });
  } catch (err) {
    console.error('[forgotPassword]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const resetPassword = async (req, res) => {
  const { token, new_password } = req.body;

  try {
    const [rows] = await db.execute(
      `SELECT prt.id, prt.user_id
       FROM password_reset_tokens prt
       WHERE prt.token = ? AND prt.used = 0 AND prt.expires_at > NOW()`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 12);
    await db.execute(
      "UPDATE usuarios_app SET password = ?, status = 'verified' WHERE id = ?",
      [hashedPassword, rows[0].user_id]
    );
    await db.execute('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [rows[0].id]);

    return res.json({ message: 'Contraseña restablecida correctamente' });
  } catch (err) {
    console.error('[resetPassword]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { register, login, refresh, logout, forgotPassword, changePassword, resetPassword };
