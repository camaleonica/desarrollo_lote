const db = require('../config/db');

async function getUsuarioConCliente(userId) {
  const [rows] = await db.execute(
    `SELECT u.id, u.email, u.status, u.cliente_id, u.medio_pago_default_id,
            u.notificaciones, u.foto_perfil, u.cuenta_cobro,
            p.nombre, p.apellido, p.direccion, p.documento,
            c.admitido, c.categoria, c.numeroPais,
            pa.nombre AS pais_nombre
     FROM usuarios_app u
     LEFT JOIN clientes c ON c.identificador = u.cliente_id
     LEFT JOIN personas p ON p.identificador = c.identificador
     LEFT JOIN paises pa ON pa.numero = c.numeroPais
     WHERE u.id = ?`,
    [userId]
  );
  return rows[0] || null;
}

async function requireCliente(userId) {
  const usuario = await getUsuarioConCliente(userId);
  if (!usuario) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  if (!usuario.cliente_id) {
    const err = new Error('Completá tu registro (KYC) antes de continuar');
    err.status = 403;
    err.code = 'KYC_REQUIRED';
    throw err;
  }
  return usuario;
}

async function countMediosPagoVerificados(userId) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS total
     FROM medios_pago
     WHERE usuario_id = ? AND is_active = 1 AND verificado = 1`,
    [userId]
  );
  return rows[0]?.total || 0;
}

async function countMediosPagoActivos(userId) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS total FROM medios_pago WHERE usuario_id = ? AND is_active = 1`,
    [userId]
  );
  return rows[0]?.total || 0;
}

async function tieneMultasPendientes(clienteId) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS total FROM multas
     WHERE cliente_id = ? AND pagada = 0`,
    [clienteId]
  );
  return (rows[0]?.total || 0) > 0;
}

function mapKycStatus(usuario) {
  if (!usuario.cliente_id) return 'pending';
  if (usuario.admitido === 'si') return 'approved';
  return 'submitted';
}

function mapUserResponse(usuario) {
  return {
    id: usuario.id,
    email: usuario.email,
    status: usuario.status,
    first_name: usuario.nombre || '',
    last_name: usuario.apellido || '',
    legal_address: usuario.direccion || '',
    country: usuario.pais_nombre || 'Argentina',
    categoria: usuario.categoria || 'comun',
    kyc_status: mapKycStatus(usuario),
    medio_pago_default_id: usuario.medio_pago_default_id,
    notificaciones: Boolean(usuario.notificaciones),
    foto_perfil: usuario.foto_perfil || null,
    cuenta_cobro: usuario.cuenta_cobro,
  };
}

module.exports = {
  getUsuarioConCliente,
  requireCliente,
  countMediosPagoVerificados,
  countMediosPagoActivos,
  tieneMultasPendientes,
  mapKycStatus,
  mapUserResponse,
};
