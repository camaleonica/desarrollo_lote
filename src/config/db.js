const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || 'salchipapa01',
  database: process.env.DB_NAME     || 'lote_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone: 'Z',
});

// Verificar conexión al iniciar
// Intentar conexión con reintentos; no finalizar el proceso inmediatamente
(async function verifyConnectionWithRetries() {
  const maxRetries = 5;
  const delayMs = 3000;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const conn = await pool.getConnection();
      console.log('✅  MySQL conectado');
      conn.release();
      return;
    } catch (err) {
      attempt += 1;
      console.error(`❌  MySQL conexión fallida (${attempt}/${maxRetries}):`, err.message);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }

  console.warn('⚠️  No se pudo conectar a MySQL tras varios intentos. La aplicación continuará y las consultas fallarán hasta restablecer la conexión.');
})();

module.exports = pool;
