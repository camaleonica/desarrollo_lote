const { Router } = require('express');
const { body, param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { list, pay } = require('../controllers/fineController');

const router = Router();

router.use(authenticate);

/** WF-13 · GET /fines */
router.get('/', list);

/** WF-13 · POST /fines/:id/pay */
router.post(
  '/:id/pay',
  [
    param('id').isInt({ min: 1 }),
    body('medio_pago_id').optional().isInt({ min: 1 }),
  ],
  validate,
  pay
);

module.exports = router;
