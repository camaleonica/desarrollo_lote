const cron = require('node-cron');
const { runFineJobs } = require('../services/fineService');
const { cerrarSubastasVencidas } = require('../services/auctionCloseService');

function startScheduler() {
  cron.schedule('*/15 * * * *', async () => {
    try {
      const fines = await runFineJobs();
      const closed = await cerrarSubastasVencidas();
      if (fines.impagos || fines.multasVencidas || closed) {
        console.log('[scheduler]', { fines, subastasCerradas: closed });
      }
    } catch (err) {
      console.error('[scheduler]', err);
    }
  });

  console.log('⏱️  Scheduler activo (multas + cierre de subastas cada 15 min)');
}

module.exports = { startScheduler };
