const db = require('../config/db');
const {
  getUsuarioConCliente,
  mapUserResponse,
} = require('../utils/userContext');
const { sendKycApprovedEmail } = require('../services/emailService');

const shouldAutoApproveKyc = () => process.env.AUTO_APPROVE_KYC !== 'false';

const getMe = async (req, res) => {
  try {
    const usuario = await getUsuarioConCliente(req.user.id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const [docs] = await db.execute(
      'SELECT tipo, ruta FROM documentos_cliente WHERE cliente_id = ?',
      [usuario.cliente_id]
    );

    const user = mapUserResponse(usuario);
    user.dni_front_path = docs.find((d) => d.tipo === 'dni_frente')?.ruta || null;
    user.dni_back_path = docs.find((d) => d.tipo === 'dni_dorso')?.ruta || null;

    return res.json({ user });
  } catch (err) {
    console.error('[getMe]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const submitKyc = async (req, res) => {
  const { first_name, last_name, legal_address, country } = req.body;
  const userId = req.user.id;

  const dniFrontPath = req.files?.dni_front?.[0]?.filename
    ? `uploads/dni/${req.files.dni_front[0].filename}`
    : null;
  const dniBackPath = req.files?.dni_back?.[0]?.filename
    ? `uploads/dni/${req.files.dni_back[0].filename}`
    : null;

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [users] = await conn.execute(
      'SELECT id, cliente_id FROM usuarios_app WHERE id = ? FOR UPDATE',
      [userId]
    );
    if (users.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    let clienteId = users[0].cliente_id;

    const [paises] = await conn.execute(
      'SELECT numero FROM paises WHERE nombre = ? OR nombreCorto = ? LIMIT 1',
      [country || 'Argentina', country || 'AR']
    );
    const numeroPais = paises[0]?.numero || 32;

    const [verificador] = await conn.execute(
      'SELECT identificador FROM empleados ORDER BY identificador LIMIT 1'
    );
    const verificadorId = verificador[0]?.identificador || 1;

    if (!clienteId) {
      const documento = `TMP-${userId}-${Date.now()}`.slice(0, 20);
      const [personaResult] = await conn.execute(
        `INSERT INTO personas (documento, nombre, apellido, direccion, estado)
         VALUES (?, ?, ?, ?, 'activo')`,
        [documento, first_name, last_name, legal_address]
      );

      clienteId = personaResult.insertId;

      await conn.execute(
        `INSERT INTO clientes (identificador, numeroPais, admitido, categoria, verificador)
         VALUES (?, ?, 'no', 'comun', ?)`,
        [clienteId, numeroPais, verificadorId]
      );

      await conn.execute(
        'UPDATE usuarios_app SET cliente_id = ? WHERE id = ?',
        [clienteId, userId]
      );
    } else {
      await conn.execute(
        `UPDATE personas SET nombre = ?, apellido = ?, direccion = ? WHERE identificador = ?`,
        [first_name, last_name, legal_address, clienteId]
      );
      await conn.execute(
        'UPDATE clientes SET numeroPais = ? WHERE identificador = ?',
        [numeroPais, clienteId]
      );
    }

    if (dniFrontPath) {
      await conn.execute(
        `INSERT INTO documentos_cliente (cliente_id, tipo, ruta)
         VALUES (?, 'dni_frente', ?)
         ON DUPLICATE KEY UPDATE ruta = VALUES(ruta)`,
        [clienteId, dniFrontPath]
      );
    }
    if (dniBackPath) {
      await conn.execute(
        `INSERT INTO documentos_cliente (cliente_id, tipo, ruta)
         VALUES (?, 'dni_dorso', ?)
         ON DUPLICATE KEY UPDATE ruta = VALUES(ruta)`,
        [clienteId, dniBackPath]
      );
    }

    if (shouldAutoApproveKyc()) {
      await conn.execute(
        "UPDATE clientes SET admitido = 'si', categoria = 'comun' WHERE identificador = ?",
        [clienteId]
      );
    }

    await conn.commit();

    const [userEmail] = await db.execute(
      'SELECT email FROM usuarios_app WHERE id = ?',
      [userId]
    );
    if (shouldAutoApproveKyc() && userEmail[0]?.email) {
      await sendKycApprovedEmail(userEmail[0].email, 'comun');
    }

    return res.json({
      message: shouldAutoApproveKyc()
        ? 'Verificación aprobada. Ya podés participar en subastas.'
        : 'Verificación enviada. El proceso puede demorar hasta 24h.',
      kyc_status: shouldAutoApproveKyc() ? 'approved' : 'submitted',
    });
  } catch (err) {
    await conn.rollback();
    console.error('[submitKyc]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    conn.release();
  }
};

const updateProfile = async (req, res) => {
  const { medio_pago_default_id, notificaciones, cuenta_cobro } = req.body;

  try {
    const usuario = await getUsuarioConCliente(req.user.id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (medio_pago_default_id != null) {
      const [pm] = await db.execute(
        'SELECT id FROM medios_pago WHERE id = ? AND usuario_id = ? AND is_active = 1',
        [medio_pago_default_id, req.user.id]
      );
      if (pm.length === 0) {
        return res.status(404).json({ message: 'Medio de pago no encontrado' });
      }
    }

    await db.execute(
      `UPDATE usuarios_app SET
         medio_pago_default_id = COALESCE(?, medio_pago_default_id),
         notificaciones = COALESCE(?, notificaciones),
         cuenta_cobro = COALESCE(?, cuenta_cobro)
       WHERE id = ?`,
      [
        medio_pago_default_id ?? null,
        notificaciones != null ? (notificaciones ? 1 : 0) : null,
        cuenta_cobro ?? null,
        req.user.id,
      ]
    );

    const updated = await getUsuarioConCliente(req.user.id);
    return res.json({ message: 'Perfil actualizado', user: mapUserResponse(updated) });
  } catch (err) {
    console.error('[updateProfile]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const uploadAvatar = async (req, res) => {
  if (!req.file?.filename) {
    return res.status(422).json({ message: 'Debés enviar una imagen (campo avatar)' });
  }

  const ruta = `uploads/avatars/${req.file.filename}`;

  try {
    await db.execute(
      'UPDATE usuarios_app SET foto_perfil = ? WHERE id = ?',
      [ruta, req.user.id]
    );
    const updated = await getUsuarioConCliente(req.user.id);
    return res.json({
      message: 'Foto de perfil actualizada',
      user: mapUserResponse(updated),
    });
  } catch (err) {
    console.error('[uploadAvatar]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { getMe, submitKyc, updateProfile, uploadAvatar };
