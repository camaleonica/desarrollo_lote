/**
 * Adaptador mobile → API Loté (Express + MySQL + WebSocket)
 */
import {
  apiRequest,
  apiMultipartRequest,
  setTokens,
  clearSession,
  getRefreshToken,
  ApiError,
} from './api';
import { getApiBaseUrl } from '../config/api';

function mapUser(user) {
  if (!user) return null;
  return {
    ...user,
    id: user.id != null ? Number(user.id) : user.id,
    nombre: user.first_name || user.nombre || '',
    apellido: user.last_name || user.apellido || '',
    domicilio: user.legal_address || user.domicilio || '',
    kyc_status: user.kyc_status || null,
    categoria: user.categoria || 'comun',
    notificaciones: Boolean(user.notificaciones),
    foto_perfil: user.foto_perfil || null,
    medio_pago_default_id: user.medio_pago_default_id != null
      ? Number(user.medio_pago_default_id)
      : null,
  };
}

export function resolveMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

function mapPaymentMethod(item) {
  const currency = item.currency || 'ARS';
  const tipoMap = {
    credit_card: 'Tarjeta de crédito',
    bank_account: 'Cuenta bancaria',
    certified_check: 'Cheque certificado',
  };
  return {
    ...item,
    currency,
    moneda: currency === 'USD' ? 'Dólares' : 'Pesos',
    tipo: tipoMap[item.type] || item.type,
    titular: item.bank_name || item.card_brand || item.label || '',
    ultimos_digitos: item.card_last4 || item.account_number || '',
    label: item.label,
    estado: item.status || (item.is_active ? (item.verificado ? 'activo' : 'pendiente') : 'inactivo'),
  };
}

function appendImage(form, field, asset) {
  if (!asset?.uri) return;
  form.append(field, {
    uri: asset.uri,
    name: asset.fileName || `${field}.jpg`,
    type: asset.mimeType || 'image/jpeg',
  });
}

async function saveAuthResponse(data) {
  await setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  return { user: mapUser(data.user), token: data.accessToken };
}

// ─── Auth ────────────────────────────────────────────────────

export async function login(email, password) {
  const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
  return saveAuthResponse(data);
}

export async function registerProvisional(email) {
  const data = await apiRequest('/auth/register', { method: 'POST', body: { email } });
  const auth = await saveAuthResponse(data);
  return { ...auth, provisionalPassword: data.provisionalPassword };
}

export async function changePassword({ currentPassword, newPassword }) {
  return apiRequest('/auth/change-password', {
    method: 'POST',
    auth: true,
    body: { current_password: currentPassword, new_password: newPassword },
  });
}

export async function submitKyc({ first_name, last_name, legal_address, country = 'Argentina', dniFront, dniBack }) {
  const form = new FormData();
  form.append('first_name', first_name);
  form.append('last_name', last_name);
  form.append('legal_address', legal_address);
  form.append('country', country);
  appendImage(form, 'dni_front', dniFront);
  appendImage(form, 'dni_back', dniBack);
  return apiMultipartRequest('/users/me/kyc', { method: 'POST', formData: form, auth: true });
}

export async function forgotPassword(email) {
  return apiRequest('/auth/forgot-password', { method: 'POST', body: { email } });
}

export async function resetPassword(token, newPassword) {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: { token, new_password: newPassword },
  });
}

export async function getProfile() {
  const data = await apiRequest('/users/me', { auth: true });
  const user = mapUser(data.user);
  if (!user?.id) throw new ApiError('No se pudo obtener el perfil del usuario');
  return user;
}

export async function updateProfile(payload) {
  const data = await apiRequest('/users/me', { method: 'PATCH', auth: true, body: payload });
  return mapUser(data.user);
}

export async function uploadAvatar(asset) {
  if (!asset?.uri) throw new ApiError('No se seleccionó ninguna imagen');
  const form = new FormData();
  form.append('avatar', {
    uri: asset.uri,
    name: asset.fileName || 'avatar.jpg',
    type: asset.mimeType || 'image/jpeg',
  });
  const data = await apiMultipartRequest('/users/me/avatar', { method: 'POST', formData: form, auth: true });
  return mapUser(data.user);
}

export async function logout() {
  const refreshToken = await getRefreshToken();
  try {
    if (refreshToken) {
      await apiRequest('/auth/logout', { method: 'POST', auth: true, body: { refreshToken } });
    }
  } finally {
    await clearSession();
  }
}

// ─── Medios de pago ──────────────────────────────────────────

export async function fetchPaymentMethods() {
  const data = await apiRequest('/payment-methods', { auth: true });
  return (data.payment_methods || []).map(mapPaymentMethod);
}

export async function addPaymentMethod(payload) {
  const type = payload.type
    || (payload.tipo === 'Tarjeta de crédito' ? 'credit_card'
      : payload.tipo === 'Cheque certificado' ? 'certified_check' : 'bank_account');

  const body = {
    type,
    currency: payload.currency || 'ARS',
  };

  if (type === 'credit_card') {
    Object.assign(body, {
      card_brand: payload.card_brand || payload.titular || 'Tarjeta',
      card_last4: String(payload.card_last4 || payload.ultimos_digitos || '').slice(-4),
    });
  } else if (type === 'certified_check') {
    body.monto_reservado = Number(payload.monto_reservado || payload.monto || 0);
  } else {
    Object.assign(body, {
      bank_name: payload.bank_name || payload.titular || 'Banco',
      account_number: String(payload.account_number || payload.ultimos_digitos || ''),
    });
  }

  return apiRequest('/payment-methods', { method: 'POST', auth: true, body });
}

export async function deletePaymentMethod(id) {
  return apiRequest(`/payment-methods/${id}`, { method: 'DELETE', auth: true });
}

export async function setDefaultPaymentMethod(id) {
  const data = await apiRequest('/users/me', {
    method: 'PATCH',
    auth: true,
    body: { medio_pago_default_id: id },
  });
  return mapUser(data.user);
}

// ─── Subastas ────────────────────────────────────────────────

export async function fetchAuctions({ auth = true } = {}) {
  return apiRequest('/auctions', { auth });
}

export async function fetchCategories() {
  return apiRequest('/auctions/categories');
}

export async function fetchAuction(id, { auth = true } = {}) {
  return apiRequest(`/auctions/${id}`, { auth });
}

export async function fetchAuctionItem(auctionId, itemId, { auth = true } = {}) {
  const data = await apiRequest(`/auctions/${auctionId}/items/${itemId}`, { auth });
  return {
    ...data,
    titulo: data.titulo,
    descripcion: data.descripcion || data.descripcion_completa,
    precio_actual: data.precio_actual,
    categoria: data.categoria,
    imagen_url: data.fotos?.[0]?.url || null,
    fotos: data.fotos || [],
  };
}

export async function joinAuction(id) {
  return apiRequest(`/auctions/${id}/join`, { method: 'POST', auth: true });
}

export async function placeBid(auctionId, monto, itemId) {
  return apiRequest(`/auctions/${auctionId}/bids`, {
    method: 'POST',
    auth: true,
    body: { monto, item_id: itemId },
  });
}

export async function leaveAuction(id) {
  return apiRequest(`/auctions/${id}/leave`, { method: 'POST', auth: true });
}

// ─── Actividades / multas ────────────────────────────────────

export async function fetchActivities() {
  return apiRequest('/activities', { auth: true });
}

export async function fetchStats() {
  return apiRequest('/activities/stats', { auth: true });
}

export async function fetchFines() {
  return apiRequest('/fines', { auth: true });
}

export async function payFine(id, medioPagoId) {
  return apiRequest(`/fines/${id}/pay`, {
    method: 'POST',
    auth: true,
    body: { medio_pago_id: medioPagoId },
  });
}

// ─── Artículos ───────────────────────────────────────────────

export async function fetchMyItems() {
  return apiRequest('/items', { auth: true });
}

export async function fetchItemTracking(id) {
  return apiRequest(`/items/${id}/tracking`, { auth: true });
}

export async function createItem({ titulo, descripcion, historia, datos_relevantes, declaracion_legal, photos }) {
  const form = new FormData();
  form.append('titulo', titulo || '');
  form.append('descripcion', descripcion || '');
  if (historia) form.append('historia', historia);
  if (datos_relevantes) form.append('datos_relevantes', datos_relevantes);
  form.append('declaracion_legal', declaracion_legal ? 'true' : 'false');

  (photos || []).forEach((photo, index) => {
    form.append('photos', {
      uri: photo.uri,
      name: photo.fileName || `photo_${index}.jpg`,
      type: photo.mimeType || 'image/jpeg',
    });
  });

  return apiMultipartRequest('/items', { method: 'POST', formData: form, auth: true });
}

export async function respondItemConditions(id, acepta) {
  return apiRequest(`/items/${id}/conditions`, {
    method: 'POST',
    auth: true,
    body: { acepta },
  });
}

// ─── Compras ─────────────────────────────────────────────────

export async function finalizePurchase(auctionId, payload) {
  return apiRequest(`/purchases/auctions/${auctionId}/finalize`, {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

export async function fetchDelivery(purchaseId) {
  return apiRequest(`/purchases/${purchaseId}/delivery`, { auth: true });
}
