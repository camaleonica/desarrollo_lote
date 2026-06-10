import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { getApiBaseUrl } from '../config/api';

const TOKEN_KEY = 'lote_token';
const REFRESH_TOKEN_KEY = 'lote_refresh_token';

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function setTokens({ accessToken, refreshToken }) {
  if (accessToken) await AsyncStorage.setItem(TOKEN_KEY, accessToken);
  else await AsyncStorage.removeItem(TOKEN_KEY);

  if (refreshToken) await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  else await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** @deprecated use setTokens */
export async function setToken(token) {
  await setTokens({ accessToken: token });
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
}

export async function checkConnection() {
  const state = await NetInfo.fetch();
  return state.isConnected && state.isInternetReachable !== false;
}

export class ApiError extends Error {
  constructor(message, { status, code, errors } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

function parseErrorPayload(data, status) {
  const fieldErrors = {};
  if (Array.isArray(data?.errors)) {
    for (const item of data.errors) {
      const field = item.path || item.param;
      if (field) fieldErrors[field] = item.msg || item.message;
    }
  } else if (data?.errors && typeof data.errors === 'object') {
    Object.assign(fieldErrors, data.errors);
  }

  const message = data?.message || data?.error || 'Ocurrió un error inesperado';
  return new ApiError(message, {
    status,
    code: data?.code || (status === 409 ? 'EMAIL_EXISTS' : undefined),
    errors: Object.keys(fieldErrors).length ? fieldErrors : data?.errors,
  });
}

async function parseResponse(response) {
  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!response.ok) {
    throw parseErrorPayload(data, response.status);
  }

  return data;
}

export async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
  const online = await checkConnection();
  if (!online) {
    throw new ApiError('Sin conexión a internet. Revisá tu red e intentá de nuevo.', {
      code: 'NO_CONNECTION',
    });
  }

  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Verificá que el backend esté activo.', {
      code: 'NETWORK_ERROR',
    });
  }

  return parseResponse(response);
}

export async function apiMultipartRequest(path, { method = 'POST', formData, auth = false } = {}) {
  const online = await checkConnection();
  if (!online) {
    throw new ApiError('Sin conexión a internet. Revisá tu red e intentá de nuevo.', {
      code: 'NO_CONNECTION',
    });
  }

  const headers = {};
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers,
      body: formData,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Verificá que el backend esté activo.', {
      code: 'NETWORK_ERROR',
    });
  }

  return parseResponse(response);
}
