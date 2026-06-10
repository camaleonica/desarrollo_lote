const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const {
  register, login, refresh, logout, forgotPassword, changePassword, resetPassword,
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
  ],
  validate,
  register
);

/**
 * POST /auth/change-password  (requiere auth)
 */
router.post(
  '/change-password',
  authenticate,
  [
    body('current_password').notEmpty().withMessage('Contraseña provisoria requerida'),
    body('new_password')
      .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
      .matches(/\d/).withMessage('La contraseña debe contener al menos un número'),
  ],
  validate,
  changePassword
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

/**
 * POST /auth/forgot-password
 */
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Email inválido').normalizeEmail()],
  validate,
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('new_password')
      .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
      .matches(/\d/).withMessage('La contraseña debe contener al menos un número'),
  ],
  validate,
  resetPassword
);

module.exports = router;
