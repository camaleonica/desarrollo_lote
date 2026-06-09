const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'lote_db',
} = process.env;

async function main() {
  const schemaPath = path.join(__dirname, '../database/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log(`Conectando a MySQL ${DB_USER}@${DB_HOST}:${DB_PORT}...`);

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  const ignorableCodes = new Set([
    'ER_DUP_KEYNAME',
    'ER_TABLE_EXISTS_ERROR',
    'ER_DUP_ENTRY',
  ]);

  try {
    const statements = sql
      .split(';')
      .map((part) => part.replace(/--.*$/gm, '').trim())
      .filter(Boolean);

    for (const statement of statements) {
      try {
        await connection.query(`${statement};`);
      } catch (error) {
        if (!ignorableCodes.has(error.code)) throw error;
      }
    }

    console.log(`✅  Base "${DB_NAME}" y tablas creadas/verificadas correctamente.`);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('❌  Error al configurar la base de datos:', err.message);
  if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('   Revisá DB_USER y DB_PASSWORD en backend/.env');
  }
  if (err.code === 'ECONNREFUSED') {
    console.error('   MySQL no está corriendo. Iniciá XAMPP → MySQL.');
  }
  process.exit(1);
});
