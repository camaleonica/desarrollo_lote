const { Router } = require('express');
const { body, param } = require('express-validator');
const { requireAdmin } = require('../middleware/adminAuth');
const { validate } = require('../middleware/validate');
const {
  listPendingKyc,
  reviewKyc,
  listPendingItems,
  reviewItem,
  verifyPaymentMethod,
  listPendingPaymentMethods,
  listOpenSubastas,
} = require('../controllers/adminController');

const router = Router();

router.use(requireAdmin);

router.get('/kyc/pending', listPendingKyc);
router.get('/subastas', listOpenSubastas);
router.get('/payment-methods/pending', listPendingPaymentMethods);
router.patch(
  '/clients/:id/kyc',
  [
    param('id').isInt({ min: 1 }),
    body('admitido').isIn(['si', 'no']),
    body('categoria').optional().isIn(['comun', 'especial', 'plata', 'oro', 'platino']),
  ],
  validate,
  reviewKyc
);

router.get('/items/pending', listPendingItems);
router.patch(
  '/items/:id/review',
  [
    param('id').isInt({ min: 1 }),
    body('estado_solicitud').isIn(['aceptado', 'rechazado']),
    body('motivo_rechazo').optional().trim(),
    body('precio_base').optional().isFloat({ gt: 0 }),
    body('comision').optional().isFloat({ gt: 0 }),
    body('subasta_id').optional().isInt({ min: 1 }),
    body('deposito_ubicacion').optional().trim(),
  ],
  validate,
  reviewItem
);

router.patch(
  '/payment-methods/:id/verify',
  [
    param('id').isInt({ min: 1 }),
    body('verificado').isBoolean(),
  ],
  validate,
  verifyPaymentMethod
);

module.exports = router;
