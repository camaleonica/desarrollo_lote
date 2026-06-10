const db = require('../config/db');
const {
  puedeAccederSubasta,
  incrementoMinimo,
  validarPuja,
  CATEGORIA_LABELS,
} = require('../utils/auctions');
const {
  getUsuarioConCliente,
  requireCliente,
  countMediosPagoActivos,
  tieneMultasPendientes,
} = require('../utils/userContext');
const { validarMedioParaPuja } = require('../services/paymentRules');
const { emitAuctionUpdate } = require('../ws/auctionSocket');
const { getProductPhotos } = require('./itemController');

function publicImageUrl(ruta) {
  if (!ruta) return null;
  const clean = String(ruta).replace(/\\/g, '/').replace(/^\//, '');
  return `/${clean}`;
}

async function getMejorPuja(itemId) {
  const [rows] = await db.execute(
    `SELECT p.importe, pe.nombre, pe.apellido, p.asistente
     FROM pujos p
     JOIN asistentes a ON a.identificador = p.asistente
     JOIN clientes c ON c.identificador = a.cliente
     JOIN personas pe ON pe.identificador = c.identificador
     WHERE p.item = ?
     ORDER BY p.importe DESC, p.identificador DESC
     LIMIT 1`,
    [itemId]
  );
  return rows[0] || null;
}

async function getSubastaBase(subastaId) {
  const [rows] = await db.execute(
    `SELECT s.*, pe.nombre AS subastador_nombre, pe.apellido AS subastador_apellido
     FROM subastas s
     LEFT JOIN subastadores sub ON sub.identificador = s.subastador
     LEFT JOIN personas pe ON pe.identificador = sub.identificador
     WHERE s.identificador = ?`,
    [subastaId]
  );
  return rows[0] || null;
}

async function getPiezaActual(subasta) {
  if (!subasta.pieza_actual_id) return null;

  const [rows] = await db.execute(
    `SELECT ic.identificador AS item_id, ic.precioBase, ic.comision, ic.subastado,
            p.identificador AS producto_id, p.titulo, p.descripcionCatalogo,
            p.descripcionCompleta, p.datos_relevantes
     FROM itemsCatalogo ic
     JOIN productos p ON p.identificador = ic.producto
     WHERE ic.identificador = ?`,
    [subasta.pieza_actual_id]
  );
  return rows[0] || null;
}

function evaluarDisponibilidad(subasta, catalogo, pieza) {
  if (!subasta || subasta.estado !== 'abierta') {
    return { agotada: true, motivo_agotada: 'Esta subasta ya finalizó' };
  }
  if (!catalogo?.length) {
    return { agotada: true, motivo_agotada: 'No hay piezas en el catálogo' };
  }
  const disponibles = catalogo.filter((item) => !item.subastado);
  if (!disponibles.length) {
    return { agotada: true, motivo_agotada: 'Todas las piezas fueron subastadas' };
  }
  if (!pieza) {
    return { agotada: true, motivo_agotada: 'No hay pieza activa en este momento' };
  }
  if (pieza.subastado === 'si') {
    return { agotada: true, motivo_agotada: 'La pieza actual ya fue vendida' };
  }
  return { agotada: false, motivo_agotada: null };
}

function aplicarDisponibilidad(acceso, disponibilidad) {
  if (!disponibilidad.agotada) return acceso;
  return {
    ...acceso,
    puedeIngresar: false,
    puedePujar: false,
    puede_ingresar: false,
    puede_pujar: false,
    motivo_bloqueo: disponibilidad.motivo_agotada,
  };
}

async function evaluarAcceso(usuario, subasta) {
  const motivos = [];
  let puedeIngresar = true;

  if (!usuario?.cliente_id) {
    return {
      puedeIngresar: false,
      puedePujar: false,
      puede_ingresar: false,
      puede_pujar: false,
      motivo_bloqueo: 'Registro incompleto',
    };
  }

  if (usuario.admitido !== 'si') {
    motivos.push('Tu cuenta está pendiente de verificación');
    puedeIngresar = false;
  }

  if (!puedeAccederSubasta(usuario.categoria, subasta.categoria)) {
    motivos.push(`Requiere categoría ${CATEGORIA_LABELS[subasta.categoria] || subasta.categoria}`);
    puedeIngresar = false;
  }

  const medios = await countMediosPagoActivos(usuario.id);
  if (medios === 0) {
    motivos.push('Necesitás al menos un medio de pago registrado');
    puedeIngresar = false;
  }

  if (await tieneMultasPendientes(usuario.cliente_id)) {
    motivos.push('Tenés multas pendientes de pago');
    puedeIngresar = false;
  }

  const [defaultPm] = await db.execute(
    `SELECT mp.id, mp.verificado
     FROM usuarios_app u
     LEFT JOIN medios_pago mp ON mp.id = u.medio_pago_default_id AND mp.is_active = 1
     WHERE u.id = ?`,
    [usuario.id]
  );
  const puedePujar = puedeIngresar
    && Boolean(defaultPm[0]?.id)
    && Boolean(defaultPm[0]?.verificado);

  if (puedeIngresar && !defaultPm[0]?.id) {
    motivos.push('Definí una forma de pago predeterminada en tu perfil');
  } else if (puedeIngresar && defaultPm[0]?.id && !defaultPm[0]?.verificado) {
    motivos.push('Tu medio de pago predeterminado está pendiente de verificación');
  }

  const motivo_bloqueo = motivos.length ? motivos.join('. ') : null;

  return {
    puedeIngresar,
    puedePujar,
    puede_ingresar: puedeIngresar,
    puede_pujar: puedePujar,
    motivo_bloqueo,
  };
}

function mapSubastaListItem(subasta, usuario) {
  const bloqueada = usuario?.cliente_id
    ? !puedeAccederSubasta(usuario.categoria, subasta.categoria)
    : true;

  return {
    id: subasta.identificador,
    titulo: subasta.nombre || `Subasta #${subasta.identificador}`,
    categoria: CATEGORIA_LABELS[subasta.categoria] || subasta.categoria,
    categoria_codigo: subasta.categoria,
    fecha: subasta.fecha,
    hora: subasta.hora,
    moneda: subasta.moneda,
    estado: subasta.estado === 'abierta' ? 'En vivo' : 'Cerrada',
    ubicacion: subasta.ubicacion,
    bloqueada,
    precio_actual: subasta.precio_actual || 0,
    imagen_url: publicImageUrl(subasta.imagen_ruta),
  };
}

async function buildSubastaDetail(subastaId, usuario) {
  const subasta = await getSubastaBase(subastaId);
  if (!subasta) return null;

  const pieza = await getPiezaActual(subasta);
  const acceso = await evaluarAcceso(usuario, subasta);

  let precioActual = pieza?.precioBase || 0;
  let pujaLider = null;

  if (pieza) {
    const mejor = await getMejorPuja(pieza.item_id);
    if (mejor) {
      precioActual = Number(mejor.importe);
      pujaLider = { nombre: mejor.nombre, apellido: mejor.apellido };
    }
  }

  const incremento = pieza
    ? incrementoMinimo(pieza.precioBase, precioActual) - precioActual
    : 0;

  const [catalogoRows] = await db.execute(
    `SELECT ic.identificador AS id, ic.precioBase, ic.comision, ic.subastado,
            p.identificador AS producto_id, p.titulo, p.descripcionCatalogo AS descripcion
     FROM catalogos cat
     JOIN itemsCatalogo ic ON ic.catalogo = cat.identificador
     JOIN productos p ON p.identificador = ic.producto
     WHERE cat.subasta = ?
     ORDER BY ic.identificador`,
    [subastaId]
  );

  const catalogo = await Promise.all(catalogoRows.map(async (row) => {
    const fotos = await getProductPhotos(row.producto_id);
    return {
      id: row.id,
      numero_pieza: row.id,
      titulo: row.titulo,
      descripcion: row.descripcion,
      precio_base: row.precioBase,
      comision: row.comision,
      subastado: row.subastado === 'si',
      imagen_url: fotos[0]?.url || null,
      fotos,
    };
  }));

  const piezaFotos = pieza?.producto_id ? await getProductPhotos(pieza.producto_id) : [];
  const disponibilidad = evaluarDisponibilidad(subasta, catalogo, pieza);
  const accesoFinal = aplicarDisponibilidad(acceso, disponibilidad);

  const [sesionActiva] = usuario
    ? await db.execute(
        `SELECT ss.subasta_id
         FROM sesiones_subasta ss
         WHERE ss.usuario_id = ? AND ss.activa = 1 AND ss.subasta_id = ?`,
        [usuario.id, subastaId]
      )
    : [[]];
  const conectado_a_esta = sesionActiva.length > 0;

  return {
    id: subasta.identificador,
    titulo: pieza?.titulo || subasta.nombre || `Subasta #${subasta.identificador}`,
    categoria: CATEGORIA_LABELS[subasta.categoria] || subasta.categoria,
    categoria_codigo: subasta.categoria,
    moneda: subasta.moneda,
    fecha: subasta.fecha,
    hora: subasta.hora,
    ubicacion: subasta.ubicacion,
    subastador: subasta.subastador_nombre
      ? `${subasta.subastador_nombre} ${subasta.subastador_apellido || ''}`.trim()
      : null,
    estado: subasta.estado,
    streaming_url: subasta.streaming_url,
    fecha_fin: subasta.fecha_cierre,
    descripcion: pieza?.descripcionCatalogo || pieza?.descripcionCompleta || '',
    precio_actual: precioActual,
    precio_base: pieza?.precioBase || 0,
    incremento_minimo: incremento > 0 ? incremento : Math.ceil((pieza?.precioBase || 0) * 0.01),
    comision: pieza?.comision || 0,
    puja_lider: pujaLider,
    imagen_url: piezaFotos[0]?.url || catalogo[0]?.imagen_url || publicImageUrl(`uploads/demo/auction-${subastaId}.webp`),
    pieza_actual: pieza
      ? {
          id: pieza.item_id,
          numero: pieza.item_id,
          titulo: pieza.titulo,
          descripcion: pieza.descripcionCatalogo,
          descripcion_completa: pieza.descripcionCompleta,
          datos_relevantes: pieza.datos_relevantes,
          precio_base: pieza.precioBase,
          imagen_url: piezaFotos[0]?.url || null,
          fotos: piezaFotos,
        }
      : null,
    catalogo,
    ...disponibilidad,
    ...accesoFinal,
    conectado_a_esta,
  };
}

const list = async (req, res) => {
  try {
    const usuario = req.user ? await getUsuarioConCliente(req.user.id) : null;

    const [rows] = await db.execute(
      `SELECT s.*,
              (SELECT MAX(p.importe)
               FROM pujos p
               JOIN itemsCatalogo ic ON ic.identificador = p.item
               JOIN catalogos c ON c.identificador = ic.catalogo
               WHERE c.subasta = s.identificador) AS precio_actual,
              (SELECT f.ruta
               FROM itemsCatalogo ic
               JOIN fotos f ON f.producto = ic.producto
               WHERE ic.identificador = s.pieza_actual_id
               ORDER BY f.orden
               LIMIT 1) AS imagen_ruta
       FROM subastas s
       WHERE s.estado = 'abierta'
       ORDER BY s.fecha ASC, s.hora ASC`
    );

    return res.json(rows.map((row) => mapSubastaListItem(row, usuario)));
  } catch (err) {
    console.error('[auctions.list]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const categories = async (_req, res) => {
  return res.json(Object.values(CATEGORIA_LABELS));
};

const getById = async (req, res) => {
  try {
    const usuario = req.user ? await getUsuarioConCliente(req.user.id) : null;
    const detail = await buildSubastaDetail(req.params.id, usuario);
    if (!detail) {
      return res.status(404).json({ message: 'Subasta no encontrada' });
    }
    return res.json(detail);
  } catch (err) {
    console.error('[auctions.getById]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const getItem = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT ic.identificador AS id, ic.precioBase, ic.comision,
              p.titulo, p.descripcionCatalogo, p.descripcionCompleta,
              p.historia, p.datos_relevantes, cat.subasta AS subasta_id
       FROM itemsCatalogo ic
       JOIN productos p ON p.identificador = ic.producto
       JOIN catalogos cat ON cat.identificador = ic.catalogo
       WHERE ic.identificador = ? AND cat.subasta = ?`,
      [req.params.itemId, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pieza no encontrada' });
    }

    const item = rows[0];
    const mejor = await getMejorPuja(item.id);
    const [productoRow] = await db.execute(
      'SELECT producto FROM itemsCatalogo WHERE identificador = ?',
      [item.id]
    );
    const fotos = productoRow[0]
      ? await getProductPhotos(productoRow[0].producto)
      : [];

    return res.json({
      id: item.id,
      subasta_id: item.subasta_id,
      numero_pieza: item.id,
      titulo: item.titulo,
      descripcion: item.descripcionCatalogo,
      descripcion_completa: item.descripcionCompleta,
      historia: item.historia,
      datos_relevantes: item.datos_relevantes,
      precio_base: item.precioBase,
      comision: item.comision,
      precio_actual: mejor ? Number(mejor.importe) : Number(item.precioBase),
      fotos,
    });
  } catch (err) {
    console.error('[auctions.getItem]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const join = async (req, res) => {
  const subastaId = req.params.id;

  try {
    const usuario = await requireCliente(req.user.id);
    const subasta = await getSubastaBase(subastaId);
    if (!subasta) {
      return res.status(404).json({ message: 'Subasta no encontrada' });
    }

    const pieza = await getPiezaActual(subasta);
    const [catalogoRows] = await db.execute(
      `SELECT ic.subastado
       FROM catalogos cat
       JOIN itemsCatalogo ic ON ic.catalogo = cat.identificador
       WHERE cat.subasta = ?`,
      [subastaId]
    );
    const catalogo = catalogoRows.map((row) => ({ subastado: row.subastado === 'si' }));
    const disponibilidad = evaluarDisponibilidad(subasta, catalogo, pieza);
    if (disponibilidad.agotada) {
      return res.status(410).json({ message: disponibilidad.motivo_agotada, ...disponibilidad });
    }

    const acceso = await evaluarAcceso(usuario, subasta);
    if (!acceso.puede_ingresar && !acceso.puedeIngresar) {
      return res.status(403).json({ message: acceso.motivo_bloqueo, ...acceso });
    }

    const [existente] = await db.execute(
      'SELECT identificador FROM asistentes WHERE cliente = ? AND subasta = ?',
      [usuario.cliente_id, subastaId]
    );

    let asistenteId;
    if (existente.length === 0) {
      const [count] = await db.execute(
        'SELECT COUNT(*) AS total FROM asistentes WHERE subasta = ?',
        [subastaId]
      );
      const numeroPostor = 100 + Number(count[0].total) + 1;
      const [ins] = await db.execute(
        'INSERT INTO asistentes (numeroPostor, cliente, subasta, conectado, conectado_desde) VALUES (?, ?, ?, 1, NOW())',
        [numeroPostor, usuario.cliente_id, subastaId]
      );
      asistenteId = ins.insertId;
    } else {
      asistenteId = existente[0].identificador;
      await db.execute(
        'UPDATE asistentes SET conectado = 1, conectado_desde = NOW() WHERE identificador = ?',
        [asistenteId]
      );
    }

    await db.execute(
      'UPDATE sesiones_subasta SET activa = 0 WHERE usuario_id = ?',
      [req.user.id]
    );
    await db.execute(
      'INSERT INTO sesiones_subasta (usuario_id, subasta_id, activa) VALUES (?, ?, 1)',
      [req.user.id, subastaId]
    );

    const detail = await buildSubastaDetail(subastaId, usuario);
    return res.json({
      message: 'Ingresaste a la subasta',
      asistente_id: asistenteId,
      ...detail,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message, code: err.code });
    console.error('[auctions.join]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const getLive = async (req, res) => {
  try {
    const usuario = req.user ? await getUsuarioConCliente(req.user.id) : null;
    const detail = await buildSubastaDetail(req.params.id, usuario);
    if (!detail) {
      return res.status(404).json({ message: 'Subasta no encontrada' });
    }
    return res.json(detail);
  } catch (err) {
    console.error('[auctions.getLive]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const placeBid = async (req, res) => {
  const subastaId = req.params.id;
  const { monto, item_id: itemIdBody } = req.body;

  try {
    const usuario = await requireCliente(req.user.id);
    const subasta = await getSubastaBase(subastaId);

    if (!subasta || subasta.estado !== 'abierta') {
      return res.status(404).json({ message: 'Subasta no disponible' });
    }

    const acceso = await evaluarAcceso(usuario, subasta);
    if (!acceso.puedePujar) {
      return res.status(403).json({ message: acceso.motivo_bloqueo || 'No podés pujar en esta subasta' });
    }

    const itemId = itemIdBody || subasta.pieza_actual_id;
    if (!itemId) {
      return res.status(422).json({ message: 'No hay pieza activa en la subasta' });
    }

    const pieza = await getPiezaActual({ pieza_actual_id: itemId });
    if (!pieza || pieza.subastado === 'si') {
      return res.status(422).json({ message: 'La pieza ya fue subastada' });
    }

    const mejor = await getMejorPuja(itemId);
    const mejorOferta = mejor ? Number(mejor.importe) : Number(pieza.precioBase);

    const validacion = validarPuja({
      monto,
      precioBase: pieza.precioBase,
      mejorOferta,
      categoriaSubasta: subasta.categoria,
    });

    if (!validacion.ok) {
      return res.status(422).json({
        message: validacion.message,
        minimo: validacion.minimo,
        maximo: validacion.maximo,
      });
    }

    const medioCheck = await validarMedioParaPuja(req.user.id, Number(monto), subasta.moneda);
    if (!medioCheck.ok) {
      return res.status(422).json({ message: medioCheck.message, code: 'PAYMENT_LIMIT' });
    }

    const [asistenteRows] = await db.execute(
      'SELECT identificador FROM asistentes WHERE cliente = ? AND subasta = ?',
      [usuario.cliente_id, subastaId]
    );
    if (asistenteRows.length === 0) {
      return res.status(403).json({ message: 'Debés ingresar a la subasta antes de pujar' });
    }

    const asistenteId = asistenteRows[0].identificador;

    const [pending] = await db.execute(
      `SELECT identificador FROM pujos
       WHERE asistente = ? AND item = ? AND creado_en > DATE_SUB(NOW(), INTERVAL 2 SECOND)
       ORDER BY identificador DESC LIMIT 1`,
      [asistenteId, itemId]
    );
    if (pending.length) {
      return res.status(429).json({
        message: 'Esperá la confirmación de tu puja anterior',
        code: 'BID_PENDING',
      });
    }

    const [result] = await db.execute(
      'INSERT INTO pujos (asistente, item, importe) VALUES (?, ?, ?)',
      [asistenteId, itemId, Number(monto)]
    );

    const detail = await buildSubastaDetail(subastaId, usuario);
    emitAuctionUpdate(subastaId, detail);

    return res.status(201).json({
      message: 'Puja registrada correctamente',
      puja_id: result.insertId,
      ...detail,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message, code: err.code });
    console.error('[auctions.placeBid]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const leave = async (req, res) => {
  try {
    const usuario = await requireCliente(req.user.id);
    await db.execute(
      'UPDATE asistentes SET conectado = 0 WHERE cliente = ? AND subasta = ?',
      [usuario.cliente_id, req.params.id]
    );
    await db.execute(
      'UPDATE sesiones_subasta SET activa = 0 WHERE usuario_id = ? AND subasta_id = ?',
      [req.user.id, req.params.id]
    );
    return res.json({ message: 'Saliste de la subasta' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('[auctions.leave]', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  list,
  categories,
  getById,
  getItem,
  join,
  getLive,
  placeBid,
  leave,
};
