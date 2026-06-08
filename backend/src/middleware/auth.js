const { verifyAccessToken } = require('../utils/jwt');

/**
 * Middleware de autenticación.
 * Extrae el Bearer token del header Authorization y lo valida.
 * Si es válido, agrega `req.user` con { id, email }.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Token inválido' });
  }
};

module.exports = { authenticate };
