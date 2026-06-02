import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL } from '../config/api';

const TOKEN_KEY = 'lote_token';

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token) {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
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
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Verificá que el backend esté activo.', {
      code: 'NETWORK_ERROR',
    });
  }

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
    throw new ApiError(data?.error || 'Ocurrió un error inesperado', {
      status: response.status,
      code: data?.code,
      errors: data?.errors,
    });
  }

  return data;
}
