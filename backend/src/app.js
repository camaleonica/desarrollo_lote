const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const paymentRoutes = require('./routes/paymentMethods');
const auctionRoutes = require('./routes/auctions');
const activityRoutes = require('./routes/activities');
const fineRoutes = require('./routes/fines');
const itemRoutes = require('./routes/items');
const purchaseRoutes = require('./routes/purchases');
const adminRoutes = require('./routes/admin');
const { initAuctionSocket } = require('./ws/auctionSocket');
const { startScheduler } = require('./jobs/scheduler');

function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean);

  app.use(cors({
    origin: allowedOrigins?.length ? allowedOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  app.use('/empleado', express.static(path.join(__dirname, '../public/empleado')));
  app.use('/reset', express.static(path.join(__dirname, '../public/reset')));

  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);
  app.use('/payment-methods', paymentRoutes);
  app.use('/auctions', auctionRoutes);
  app.use('/activities', activityRoutes);
  app.use('/fines', fineRoutes);
  app.use('/items', itemRoutes);
  app.use('/purchases', purchaseRoutes);
  app.use('/admin', adminRoutes);

  app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

  app.get('/', (_req, res) => {
    res.json({
      name: 'Loté API',
      version: '2.1.0',
      docs: 'REST + WebSocket (auction_update)',
      admin_panel: '/empleado/',
    });
  });

  app.use((_req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

  app.use((err, _req, res, _next) => {
    console.error('[unhandled error]', err);
    if (err.message?.includes('Solo se permiten imágenes')) {
      return res.status(422).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  });

  return app;
}

function startServer() {
  const app = createApp();
  const PORT = Number(process.env.PORT) || 3000;
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: { origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', methods: ['GET', 'POST'] },
  });
  initAuctionSocket(io);

  server.listen(PORT, () => {
    console.log(`🚀  Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🔌  WebSocket activo en el mismo puerto`);
    startScheduler();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌  El puerto ${PORT} ya está en uso.`);
      process.exit(1);
    }
    throw err;
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };
