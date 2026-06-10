const requireAdmin = (req, res, next) => {
  const key = req.headers['x-admin-key'];
  const expected = process.env.ADMIN_API_KEY;

  if (!expected) {
    return res.status(503).json({ message: 'Admin API no configurada (ADMIN_API_KEY)' });
  }
  if (key !== expected) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  next();
};

module.exports = { requireAdmin };
