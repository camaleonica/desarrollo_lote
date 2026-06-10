const API_BASE = window.location.origin;
const KEY_STORAGE = 'lote_admin_key';

const TAB_META = {
  kyc: {
    title: 'Verificar postores',
    subtitle: 'Revisá identidad y asigná categoría según la investigación (TPO).',
  },
  items: {
    title: 'Revisar artículos',
    subtitle: 'Aceptá o rechazá piezas enviadas por dueños desde la app mobile.',
  },
  payments: {
    title: 'Medios de pago',
    subtitle: 'Verificá cheques certificados y garantías antes de la subasta.',
  },
  help: {
    title: 'Ayuda',
    subtitle: 'Cómo usar el panel, usuarios demo y recupero de contraseña.',
  },
};

const PAYMENT_TYPES = {
  credit_card: 'Tarjeta de crédito',
  bank_account: 'Cuenta bancaria',
  certified_check: 'Cheque certificado',
};

const loginGate = document.getElementById('loginGate');
const appShell = document.getElementById('appShell');
const keyInput = document.getElementById('adminKey');
const loginError = document.getElementById('loginError');
const toastEl = document.getElementById('toast');

function getKey() {
  return keyInput.value.trim() || localStorage.getItem(KEY_STORAGE) || '';
}

function showToast(message, type = 'ok') {
  toastEl.textContent = message;
  toastEl.className = `toast ${type}`;
  toastEl.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toastEl.hidden = true;
  }, 3500);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMoney(value, currency = 'ARS') {
  if (value == null || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return escapeHtml(value);
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency || 'ARS',
    maximumFractionDigits: 2,
  }).format(num);
}

async function adminFetch(path, options = {}) {
  const key = getKey();
  if (!key) throw new Error('Ingresá la clave de acceso del panel.');

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': key,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = { message: text }; }
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error('Clave incorrecta. Revisá ADMIN_API_KEY en backend/.env');
  }

  if (!response.ok) {
    throw new Error(data?.message || `Error ${response.status}`);
  }

  return data;
}

function renderEmpty(container, title, subtitle) {
  container.innerHTML = `
    <div class="empty">
      <div class="empty-icon">✓</div>
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(subtitle)}</p>
    </div>`;
}

function setBadge(id, count) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = String(count);
  el.classList.toggle('has-items', count > 0);
}

function showPanel(tab) {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `panel-${tab}`);
  });
  const meta = TAB_META[tab];
  document.getElementById('pageTitle').textContent = meta.title;
  document.getElementById('pageSubtitle').textContent = meta.subtitle;
}

async function loadKyc() {
  const container = document.getElementById('kycList');
  container.innerHTML = '<div class="loading">Cargando postores…</div>';

  try {
    const rows = await adminFetch('/admin/kyc/pending');
    setBadge('badge-kyc', rows.length);

    if (!rows.length) {
      renderEmpty(container, 'Sin pendientes', 'No hay postores esperando verificación de identidad.');
      return;
    }

    container.innerHTML = rows.map((row) => `
      <article class="card">
        <div class="card-header">
          <h3>${escapeHtml(row.nombre)} ${escapeHtml(row.apellido)}</h3>
          <span class="pill">Pendiente KYC</span>
        </div>
        <div class="meta-grid">
          <div class="meta-item"><label>Email</label><span>${escapeHtml(row.email)}</span></div>
          <div class="meta-item"><label>Documento</label><span>${escapeHtml(row.documento || '—')}</span></div>
          <div class="meta-item"><label>Domicilio legal</label><span>${escapeHtml(row.direccion)}</span></div>
          <div class="meta-item"><label>ID cliente</label><span>#${escapeHtml(row.cliente_id)}</span></div>
        </div>
        <div class="dni-preview">
          ${row.dni_frente
            ? `<figure><img src="${API_BASE}/${row.dni_frente}" alt="DNI frente" onerror="this.alt='Sin imagen'" /><figcaption>DNI frente</figcaption></figure>`
            : '<p style="color:var(--muted)">Sin foto frente cargada</p>'}
          ${row.dni_dorso
            ? `<figure><img src="${API_BASE}/${row.dni_dorso}" alt="DNI dorso" onerror="this.alt='Sin imagen'" /><figcaption>DNI dorso</figcaption></figure>`
            : '<p style="color:var(--muted)">Sin foto dorso cargada</p>'}
        </div>
        <div class="form-grid">
          <label>Categoría a asignar
            <select id="cat-${row.cliente_id}">
              <option value="comun">Común</option>
              <option value="especial">Especial</option>
              <option value="plata">Plata</option>
              <option value="oro">Oro</option>
              <option value="platino">Platino</option>
            </select>
          </label>
        </div>
        <div class="card-actions">
          <button class="btn btn-success" data-action="approve-kyc" data-id="${row.cliente_id}">✓ Aprobar postor</button>
          <button class="btn btn-danger" data-action="reject-kyc" data-id="${row.cliente_id}">✕ Rechazar</button>
        </div>
      </article>
    `).join('');
  } catch (error) {
    container.innerHTML = `<div class="empty"><strong>Error</strong><p>${escapeHtml(error.message)}</p></div>`;
    setBadge('badge-kyc', 0);
  }
}

async function loadItems() {
  const container = document.getElementById('itemsList');
  container.innerHTML = '<div class="loading">Cargando artículos…</div>';

  try {
    const [items, subastas] = await Promise.all([
      adminFetch('/admin/items/pending'),
      adminFetch('/admin/subastas'),
    ]);

    setBadge('badge-items', items.length);

    if (!items.length) {
      renderEmpty(container, 'Sin pendientes', 'No hay artículos en revisión.');
      return;
    }

    const subastaOptions = subastas.map((s) =>
      `<option value="${s.id}">${escapeHtml(s.nombre)} · ${escapeHtml(s.categoria)} · ${escapeHtml(s.moneda)}</option>`
    ).join('');

    container.innerHTML = items.map((item) => `
      <article class="card">
        <div class="card-header">
          <h3>${escapeHtml(item.titulo)}</h3>
          <span class="pill">En revisión</span>
        </div>
        <div class="meta-grid">
          <div class="meta-item"><label>Dueño</label><span>${escapeHtml(item.nombre)} ${escapeHtml(item.apellido)}</span></div>
          <div class="meta-item"><label>ID producto</label><span>#${escapeHtml(item.id)}</span></div>
        </div>
        <p style="color:var(--muted); margin:0.5rem 0 0;">${escapeHtml(item.descripcionCatalogo || item.descripcionCompleta || 'Sin descripción')}</p>
        ${item.historia ? `<p style="color:var(--muted); margin:0.35rem 0 0;"><em>${escapeHtml(item.historia)}</em></p>` : ''}
        <div class="form-grid">
          <label>Precio base *
            <input type="number" id="base-${item.id}" placeholder="Ej: 10000" min="1" step="0.01" />
          </label>
          <label>Comisión *
            <input type="number" id="com-${item.id}" placeholder="Ej: 1000" min="1" step="0.01" />
          </label>
          <label>Subasta destino *
            <select id="sub-${item.id}">
              <option value="">Elegir subasta…</option>
              ${subastaOptions}
            </select>
          </label>
          <label class="full">Motivo de rechazo (solo si rechazás)
            <input type="text" id="motivo-${item.id}" placeholder="Ej: estado de conservación insuficiente" />
          </label>
        </div>
        <div class="card-actions">
          <button class="btn btn-success" data-action="approve-item" data-id="${item.id}">✓ Aceptar e incluir en subasta</button>
          <button class="btn btn-danger" data-action="reject-item" data-id="${item.id}">✕ Rechazar solicitud</button>
        </div>
      </article>
    `).join('');
  } catch (error) {
    container.innerHTML = `<div class="empty"><strong>Error</strong><p>${escapeHtml(error.message)}</p></div>`;
    setBadge('badge-items', 0);
  }
}

async function loadPayments() {
  const container = document.getElementById('paymentsList');
  container.innerHTML = '<div class="loading">Cargando medios de pago…</div>';

  try {
    const rows = await adminFetch('/admin/payment-methods/pending');
    setBadge('badge-payments', rows.length);

    if (!rows.length) {
      renderEmpty(container, 'Sin pendientes', 'No hay cheques ni medios esperando verificación.');
      return;
    }

    container.innerHTML = rows.map((row) => `
      <article class="card">
        <div class="card-header">
          <h3>${escapeHtml(row.label || PAYMENT_TYPES[row.tipo] || row.tipo)}</h3>
          <span class="pill">Pendiente</span>
        </div>
        <div class="meta-grid">
          <div class="meta-item"><label>Postor</label><span>${escapeHtml(row.nombre || '')} ${escapeHtml(row.apellido || '')}</span></div>
          <div class="meta-item"><label>Email</label><span>${escapeHtml(row.email)}</span></div>
          <div class="meta-item"><label>Tipo</label><span>${escapeHtml(PAYMENT_TYPES[row.tipo] || row.tipo)}</span></div>
          <div class="meta-item"><label>Moneda</label><span>${escapeHtml(row.currency)}</span></div>
          ${row.monto_reservado
            ? `<div class="meta-item"><label>Monto reservado</label><span>${formatMoney(row.monto_reservado, row.currency)}</span></div>`
            : ''}
        </div>
        <div class="card-actions">
          <button class="btn btn-success" data-action="verify-payment" data-id="${row.id}">✓ Marcar como verificado</button>
        </div>
      </article>
    `).join('');
  } catch (error) {
    container.innerHTML = `<div class="empty"><strong>Error</strong><p>${escapeHtml(error.message)}</p></div>`;
    setBadge('badge-payments', 0);
  }
}

async function refreshAll() {
  await Promise.all([loadKyc(), loadItems(), loadPayments()]);
}

function enterApp() {
  loginGate.hidden = true;
  appShell.hidden = false;
  refreshAll();
}

function leaveApp() {
  localStorage.removeItem(KEY_STORAGE);
  keyInput.value = '';
  appShell.hidden = true;
  loginGate.hidden = false;
  loginError.hidden = true;
}

async function tryLogin() {
  const key = keyInput.value.trim();
  if (!key) {
    loginError.textContent = 'Ingresá la clave de acceso.';
    loginError.hidden = false;
    return;
  }

  localStorage.setItem(KEY_STORAGE, key);
  try {
    await adminFetch('/admin/kyc/pending');
    loginError.hidden = true;
    enterApp();
    showToast('Acceso correcto', 'ok');
  } catch (error) {
    localStorage.removeItem(KEY_STORAGE);
    loginError.textContent = error.message;
    loginError.hidden = false;
  }
}

document.getElementById('saveKey').addEventListener('click', tryLogin);
keyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') tryLogin();
});

document.getElementById('logoutBtn').addEventListener('click', leaveApp);
document.getElementById('refreshBtn').addEventListener('click', async () => {
  showToast('Actualizando…', 'info');
  await refreshAll();
  showToast('Datos actualizados', 'ok');
});

document.querySelectorAll('.nav-item').forEach((tab) => {
  tab.addEventListener('click', () => showPanel(tab.dataset.tab));
});

document.body.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || button.disabled) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === 'reject-kyc' && !window.confirm('¿Rechazar la verificación de este postor?')) return;
  if (action === 'reject-item' && !window.confirm('¿Rechazar esta solicitud de artículo?')) return;

  button.disabled = true;

  try {
    if (action === 'approve-kyc') {
      const categoria = document.getElementById(`cat-${id}`).value;
      await adminFetch(`/admin/clients/${id}/kyc`, {
        method: 'PATCH',
        body: JSON.stringify({ admitido: 'si', categoria }),
      });
      showToast(`Postor aprobado con categoría ${categoria}`, 'ok');
    }

    if (action === 'reject-kyc') {
      await adminFetch(`/admin/clients/${id}/kyc`, {
        method: 'PATCH',
        body: JSON.stringify({ admitido: 'no' }),
      });
      showToast('Postor rechazado', 'info');
    }

    if (action === 'approve-item') {
      const precio_base = Number(document.getElementById(`base-${id}`).value);
      const comision = Number(document.getElementById(`com-${id}`).value);
      const subasta_id = Number(document.getElementById(`sub-${id}`).value);
      if (!precio_base || !comision || !subasta_id) {
        throw new Error('Completá precio base, comisión y subasta destino.');
      }
      await adminFetch(`/admin/items/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ estado_solicitud: 'aceptado', precio_base, comision, subasta_id }),
      });
      showToast('Artículo aceptado e incluido en catálogo', 'ok');
    }

    if (action === 'reject-item') {
      const motivo_rechazo = document.getElementById(`motivo-${id}`).value.trim();
      await adminFetch(`/admin/items/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ estado_solicitud: 'rechazado', motivo_rechazo: motivo_rechazo || 'No cumple requisitos' }),
      });
      showToast('Artículo rechazado', 'info');
    }

    if (action === 'verify-payment') {
      await adminFetch(`/admin/payment-methods/${id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ verificado: true }),
      });
      showToast('Medio de pago verificado', 'ok');
    }

    await refreshAll();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

const savedKey = localStorage.getItem(KEY_STORAGE);
if (savedKey) {
  keyInput.value = savedKey;
  tryLogin();
}
