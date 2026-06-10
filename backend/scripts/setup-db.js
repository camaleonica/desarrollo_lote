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

async function runSqlFile(connection, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = sql
    .split(';')
    .map((part) => part.replace(/--.*$/gm, '').trim())
    .filter(Boolean);

  const ignorableCodes = new Set([
    'ER_DUP_KEYNAME',
    'ER_TABLE_EXISTS_ERROR',
    'ER_DUP_ENTRY',
    'ER_DUP_FIELDNAME',
    'ER_FK_DUP_NAME',
    'ER_CANT_CREATE_TABLE',
  ]);

  for (const statement of statements) {
    try {
      await connection.query(`${statement};`);
    } catch (error) {
      if (!ignorableCodes.has(error.code)) throw error;
    }
  }
}

function copyDemoAuctionImages() {
  const demoDir = path.join(__dirname, '../uploads/demo');
  const mobileDir = path.join(__dirname, '../../mobile/assets/images/auctions');

  fs.mkdirSync(demoDir, { recursive: true });

  if (!fs.existsSync(mobileDir)) {
    console.warn('⚠️  No se encontraron imágenes en mobile/assets/images/auctions');
    return;
  }

  const files = fs.readdirSync(mobileDir).filter((name) => name.endsWith('.webp'));
  for (const file of files) {
    fs.copyFileSync(path.join(mobileDir, file), path.join(demoDir, file));
  }
  console.log(`🖼️  ${files.length} imágenes de subasta copiadas a uploads/demo/`);
}

async function main() {
  const schemaPath = path.join(__dirname, '../database/schema.sql');
  const seedPath = path.join(__dirname, '../database/seed.sql');

  console.log(`Conectando a MySQL ${DB_USER}@${DB_HOST}:${DB_PORT}...`);

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    console.log('📦  Aplicando schema...');
    await runSqlFile(connection, schemaPath);

    copyDemoAuctionImages();

    if (fs.existsSync(seedPath)) {
      console.log('🌱  Cargando datos de demo...');
      await runSqlFile(connection, seedPath);
    }

    console.log(`✅  Base "${DB_NAME}" lista.`);
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
