const { Router } = require('express');
const { body, param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { uploadProductPhotos } = require('../config/multerProducts');
const { list, create, getTracking, respondConditions } = require('../controllers/itemController');

const router = Router();

router.use(authenticate);

router.get('/', list);

router.post('/', (req, res, next) => {
  uploadProductPhotos(req, res, (err) => {
    if (err) return next(err);
    next();
  });
}, create);

router.get('/:id/tracking', [param('id').isInt({ min: 1 })], validate, getTracking);

router.post(
  '/:id/conditions',
  [
    param('id').isInt({ min: 1 }),
    body('acepta').isBoolean().withMessage('Indicá si aceptás las condiciones'),
  ],
  validate,
  respondConditions
);

module.exports = router;
