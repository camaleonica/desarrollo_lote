const { Router } = require('express');
const { body, param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { finalize, getDelivery, listMine } = require('../controllers/purchaseController');

const router = Router();

router.use(authenticate);

/** WF-11 · GET /purchases */
router.get('/', listMine);

/** WF-11 · POST /purchases/auctions/:id/finalize */
router.post(
  '/auctions/:id/finalize',
  [
    param('id').isInt({ min: 1 }),
    body('monto').optional().isFloat({ gt: 0 }),
    body('item_id').optional().isInt({ min: 1 }),
    body('metodo_entrega').isIn(['envio', 'retiro']).withMessage('Método de entrega inválido'),
    body('medio_pago_id').optional().isInt({ min: 1 }),
    body('direccion_entrega').optional().trim(),
  ],
  validate,
  finalize
);

/** WF-11b · GET /purchases/:id/delivery */
router.get(
  '/:id/delivery',
  [param('id').isInt({ min: 1 })],
  validate,
  getDelivery
);

module.exports = router;
