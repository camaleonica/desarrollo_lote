const CATEGORIA_RANK = {
  comun: 1,
  especial: 2,
  plata: 3,
  oro: 4,
  platino: 5,
};

const CATEGORIA_LABELS = {
  comun: 'Común',
  especial: 'Especial',
  plata: 'Plata',
  oro: 'Oro',
  platino: 'Platino',
};

function categoriaRank(categoria) {
  return CATEGORIA_RANK[String(categoria || '').toLowerCase()] || 0;
}

function puedeAccederSubasta(categoriaUsuario, categoriaSubasta) {
  return categoriaRank(categoriaUsuario) >= categoriaRank(categoriaSubasta);
}

function incrementoMinimo(precioBase, mejorOferta) {
  const base = Number(precioBase) || 0;
  const mejor = Number(mejorOferta) || base;
  return Math.ceil(mejor + base * 0.01);
}

function incrementoMaximo(precioBase, mejorOferta) {
  const base = Number(precioBase) || 0;
  const mejor = Number(mejorOferta) || base;
  return Math.floor(mejor + base * 0.2);
}

function validarPuja({ monto, precioBase, mejorOferta, categoriaSubasta }) {
  const value = Number(monto);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, message: 'El monto de la puja es inválido' };
  }

  const base = Number(precioBase) || 0;
  const mejor = Number(mejorOferta) || base;
  const cat = String(categoriaSubasta || '').toLowerCase();

  if (cat === 'oro' || cat === 'platino') {
    if (value <= mejor) {
      return { ok: false, message: `La puja debe ser mayor a ${mejor}` };
    }
    return { ok: true, minimo: mejor + 0.01, maximo: null };
  }

  const minimo = incrementoMinimo(base, mejor);
  const maximo = incrementoMaximo(base, mejor);

  if (value < minimo) {
    return {
      ok: false,
      message: `La puja mínima es ${minimo} (mejor oferta + 1% del precio base)`,
      minimo,
      maximo,
    };
  }

  if (value > maximo) {
    return {
      ok: false,
      message: `La puja máxima es ${maximo} (mejor oferta + 20% del precio base)`,
      minimo,
      maximo,
    };
  }

  return { ok: true, minimo, maximo };
}

module.exports = {
  CATEGORIA_RANK,
  CATEGORIA_LABELS,
  categoriaRank,
  puedeAccederSubasta,
  incrementoMinimo,
  incrementoMaximo,
  validarPuja,
};
