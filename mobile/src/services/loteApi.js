import { apiRequest, setToken } from './api';

export async function login(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  await setToken(data.token);
  return data;
}

export async function register(payload) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: payload,
  });
  await setToken(data.token);
  return data;
}

export async function forgotPassword(email) {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export async function getProfile() {
  return apiRequest('/auth/me', { auth: true });
}

export async function logout() {
  await setToken(null);
}

export async function fetchAuctions() {
  return apiRequest('/auctions');
}

export async function fetchCategories() {
  return apiRequest('/auctions/categories');
}

export async function fetchAuction(id) {
  return apiRequest(`/auctions/${id}`);
}

export async function placeBid(auctionId, monto) {
  return apiRequest(`/auctions/${auctionId}/bids`, {
    method: 'POST',
    auth: true,
    body: { monto },
  });
}

export async function fetchActivities() {
  return apiRequest('/activities', { auth: true });
}

export async function fetchStats() {
  return apiRequest('/activities/stats', { auth: true });
}

export async function fetchMyItems() {
  return apiRequest('/items', { auth: true });
}

export async function createItem(payload) {
  return apiRequest('/items', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

export async function fetchPaymentMethods() {
  return apiRequest('/payments', { auth: true });
}

export async function addPaymentMethod(payload) {
  return apiRequest('/payments', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}
