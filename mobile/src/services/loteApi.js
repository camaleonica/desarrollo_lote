/**
 * Adaptador mobile → API de Daniel (Express + MySQL)
 * Rutas disponibles: /auth, /users, /payment-methods
 */
import {
  apiRequest,
  apiMultipartRequest,
  setTokens,
  clearSession,
  getRefreshToken,
  ApiError,
} from './api';

function mapUser(user) {
  if (!user) return null;
  return {
    ...user,
    id: user.id != null ? Number(user.id) : user.id,
    nombre: user.first_name || user.nombre || '',
    apellido: user.last_name || user.apellido || '',
    domicilio: user.legal_address || user.domicilio || '',
    kyc_status: user.kyc_status || null,
  };
}

function mapPaymentMethod(item) {
  const currency = item.currency || 'ARS';
  return {
    ...item,
    currency,
    moneda: currency === 'USD' ? 'Dólares' : 'Pesos',
    tipo: item.type === 'credit_card' ? 'Tarjeta de crédito' : 'Cuenta bancaria',
    titular: item.bank_name || item.card_brand || item.label || '',
    ultimos_digitos: item.card_last4 || item.account_number || '',
    label: item.label,
    estado: item.status || (item.is_active ? 'activo' : 'inactivo'),
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

async function requestOrEmpty(path, options) {
  try {
    return await apiRequest(path, options);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.message === 'Ruta no encontrada')) {
      return null;
    }
    throw error;
  }
}

// ─── Auth (Daniel) ───────────────────────────────────────────

export async function login(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return saveAuthResponse(data);
}

export async function registerProvisional(email) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: { email },
  });
  const auth = await saveAuthResponse(data);
  return { ...auth, provisionalPassword: data.provisionalPassword };
}

export async function changePassword({ currentPassword, newPassword }) {
  return apiRequest('/auth/change-password', {
    method: 'POST',
    auth: true,
    body: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  });
}

/** @deprecated use registerProvisional */
export async function register(payload) {
  return registerProvisional(payload.email);
}

export async function submitKyc({ first_name, last_name, legal_address, country = 'Argentina', dniFront, dniBack }) {
  const form = new FormData();
  form.append('first_name', first_name);
  form.append('last_name', last_name);
  form.append('legal_address', legal_address);
  form.append('country', country);
  appendImage(form, 'dni_front', dniFront);
  appendImage(form, 'dni_back', dniBack);

  return apiMultipartRequest('/users/me/kyc', {
    method: 'POST',
    formData: form,
    auth: true,
  });
}

export async function forgotPassword(email) {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export async function getProfile() {
  const data = await apiRequest('/users/me', { auth: true });
  const user = mapUser(data.user);
  if (!user?.id) {
    throw new ApiError('No se pudo obtener el perfil del usuario');
  }
  return user;
}

export async function logout() {
  const refreshToken = await getRefreshToken();
  try {
    if (refreshToken) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        auth: true,
        body: { refreshToken },
      });
    }
  } finally {
    await clearSession();
  }
}

// ─── Medios de pago (Daniel) ─────────────────────────────────

export async function fetchPaymentMethods() {
  const data = await apiRequest('/payment-methods', { auth: true });
  return (data.payment_methods || []).map(mapPaymentMethod);
}

export async function addPaymentMethod(payload) {
  const isCard = payload.type === 'credit_card' || payload.tipo === 'Tarjeta de crédito';
  const body = isCard
    ? {
        type: 'credit_card',
        currency: payload.currency || 'ARS',
        card_brand: payload.card_brand || payload.titular || 'Tarjeta',
        card_last4: String(payload.card_last4 || payload.ultimos_digitos || '').slice(-4),
      }
    : {
        type: 'bank_account',
        currency: payload.currency || 'ARS',
        bank_name: payload.bank_name || payload.titular || 'Banco',
        account_number: String(payload.account_number || payload.ultimos_digitos || ''),
      };

  return apiRequest('/payment-methods', {
    method: 'POST',
    auth: true,
    body,
  });
}

export async function deletePaymentMethod(id) {
  return apiRequest(`/payment-methods/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}

// ─── Pendiente en backend de Daniel ──────────────────────────

export async function fetchAuctions() {
  const data = await requestOrEmpty('/auctions');
  return data || [];
}

export async function fetchCategories() {
  const data = await requestOrEmpty('/auctions/categories');
  return data || [];
}

export async function fetchAuction(id) {
  const data = await requestOrEmpty(`/auctions/${id}`);
  if (!data) {
    throw new ApiError('Las subastas todavía no están en el backend.', { code: 'NOT_IMPLEMENTED' });
  }
  return data;
}

export async function placeBid(auctionId, monto) {
  return apiRequest(`/auctions/${auctionId}/bids`, {
    method: 'POST',
    auth: true,
    body: { monto },
  });
}

export async function fetchActivities() {
  const data = await requestOrEmpty('/activities', { auth: true });
  return data || [];
}

export async function fetchStats() {
  const data = await requestOrEmpty('/activities/stats', { auth: true });
  return data || { total_pujas: 0, ganando: 0, ganadas: 0 };
}

export async function fetchMyItems() {
  const data = await requestOrEmpty('/items', { auth: true });
  return data || [];
}

export async function createItem(payload) {
  return apiRequest('/items', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}
