require('dotenv').config();

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const path    = require('path');

const authRoutes    = require('./routes/auth');
const userRoutes    = require('./routes/users');
const paymentRoutes = require('./routes/paymentMethods');

const app = express();

// ── Seguridad básica ──────────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Parsers ───────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Archivos estáticos (fotos DNI) ────────────────────────────
// Solo accesible internamente — en producción usar S3 + URL firmadas
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Rutas ─────────────────────────────────────────────────────
app.use('/auth',             authRoutes);
app.use('/users',            userRoutes);
app.use('/payment-methods',  paymentRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

// ── Error handler global ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[unhandled error]', err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

// ── Iniciar servidor ──────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀  Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;
