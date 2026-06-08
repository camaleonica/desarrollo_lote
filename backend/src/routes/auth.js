const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const {
  register, login, refresh, logout,
} = require('../controllers/authController');

const router = Router();

// Middleware reutilizable para manejar errores de validación
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

/**
 * POST /auth/register
 */
router.post(
  '/register',
  [
    body('email')
      .isEmail().withMessage('Email inválido')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
      .matches(/\d/).withMessage('La contraseña debe contener al menos un número'),
  ],
  validate,
  register
);

/**
 * POST /auth/login
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ],
  validate,
  login
);

/**
 * POST /auth/refresh
 */
router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token requerido')],
  validate,
  refresh
);

/**
 * POST /auth/logout  (requiere auth)
 */
router.post('/logout', authenticate, logout);

module.exports = router;
