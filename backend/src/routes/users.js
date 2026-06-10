const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const upload = require('../config/multer');
const uploadAvatar = require('../config/multerAvatar');
const { getMe, submitKyc, updateProfile, uploadAvatar: uploadAvatarHandler } = require('../controllers/userController');

const router = Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
};

// Todas las rutas de usuarios requieren autenticación
router.use(authenticate);

/**
 * GET /users/me
 */
router.get('/me', getMe);

/**
 * PATCH /users/me — WF-16 Perfil (forma de pago default, notificaciones, cuenta cobro)
 */
router.patch(
  '/me',
  [
    body('medio_pago_default_id').optional().isInt({ min: 1 }),
    body('notificaciones').optional().isBoolean(),
    body('cuenta_cobro').optional().trim().isLength({ max: 100 }),
  ],
  validate,
  updateProfile
);

/**
 * POST /users/me/kyc
 * multipart/form-data con campos + archivos dni_front / dni_back
 */
router.post(
  '/me/avatar',
  uploadAvatar.single('avatar'),
  uploadAvatarHandler
);

router.post(
  '/me/kyc',
  upload.fields([
    { name: 'dni_front', maxCount: 1 },
    { name: 'dni_back',  maxCount: 1 },
  ]),
  [
    body('first_name').trim().notEmpty().withMessage('Nombre requerido'),
    body('last_name').trim().notEmpty().withMessage('Apellido requerido'),
    body('legal_address').trim().notEmpty().withMessage('Domicilio requerido'),
  ],
  validate,
  submitKyc
);

module.exports = router;
