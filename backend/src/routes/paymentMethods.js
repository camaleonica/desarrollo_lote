const { Router } = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { list, create, remove } = require('../controllers/paymentController');

const router = Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
};

router.use(authenticate);

/**
 * GET /payment-methods
 */
router.get('/', list);

/**
 * POST /payment-methods
 */
router.post(
  '/',
  [
    body('type')
      .isIn(['credit_card', 'bank_account'])
      .withMessage('Tipo inválido. Usá credit_card o bank_account'),
    body('currency')
      .optional()
      .isIn(['ARS', 'USD'])
      .withMessage('Moneda inválida'),

    // Validaciones condicionales para tarjeta
    body('card_last4')
      .if(body('type').equals('credit_card'))
      .isLength({ min: 4, max: 4 }).withMessage('card_last4 debe tener 4 dígitos')
      .isNumeric(),

    // Validaciones condicionales para cuenta bancaria
    body('account_number')
      .if(body('type').equals('bank_account'))
      .notEmpty().withMessage('Número de cuenta requerido'),
  ],
  validate,
  create
);

/**
 * DELETE /payment-methods/:id
 */
router.delete(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('ID inválido')],
  validate,
  remove
);

module.exports = router;
