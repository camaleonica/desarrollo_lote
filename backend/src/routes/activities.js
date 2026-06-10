const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { list, stats } = require('../controllers/activityController');

const router = Router();

router.use(authenticate);

/** WF-12 · GET /activities */
router.get('/', list);

/** WF-12 · GET /activities/stats */
router.get('/stats', stats);

module.exports = router;
