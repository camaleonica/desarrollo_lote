const { Router } = require('express');
const { body, param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  list, categories, getById, getItem, join, getLive, placeBid, leave,
} = require('../controllers/auctionController');

const router = Router();

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();
  return authenticate(req, res, next);
};

/** WF-06 · GET /auctions */
router.get('/', optionalAuth, list);

/** WF-06 · GET /auctions/categories */
router.get('/categories', categories);

/** WF-07/08/09 · GET /auctions/:id */
router.get('/:id', optionalAuth, [param('id').isInt({ min: 1 })], validate, getById);

/** WF-08 · GET /auctions/:id/items/:itemId */
router.get(
  '/:id/items/:itemId',
  optionalAuth,
  [param('id').isInt({ min: 1 }), param('itemId').isInt({ min: 1 })],
  validate,
  getItem
);

/** WF-07 · POST /auctions/:id/join */
router.post(
  '/:id/join',
  authenticate,
  [param('id').isInt({ min: 1 })],
  validate,
  join
);

/** WF-09 · GET /auctions/:id/live */
router.get(
  '/:id/live',
  authenticate,
  [param('id').isInt({ min: 1 })],
  validate,
  getLive
);

/** WF-09 · POST /auctions/:id/bids */
router.post(
  '/:id/bids',
  authenticate,
  [
    param('id').isInt({ min: 1 }),
    body('monto').isFloat({ gt: 0 }).withMessage('Monto inválido'),
    body('item_id').optional().isInt({ min: 1 }),
  ],
  validate,
  placeBid
);

/** Salir de sala en vivo */
router.post(
  '/:id/leave',
  authenticate,
  [param('id').isInt({ min: 1 })],
  validate,
  leave
);

module.exports = router;
