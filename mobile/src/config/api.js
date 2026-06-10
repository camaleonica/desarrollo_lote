import { Platform } from 'react-native';
import Constants from 'expo-constants';

const LOCAL_IP = '192.168.1.47';
const DEFAULT_PORT = 3006;

function resolveEnvUrl() {
  const extra = Constants.expoConfig?.extra;
  const candidate = extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL;
  if (typeof candidate === 'string' && candidate.trim()) {
    return candidate.trim();
  }
  return null;
}

export function getApiBaseUrl() {
  const envUrl = resolveEnvUrl();
  if (envUrl) return envUrl.replace(/\/$/, '');

  const port = DEFAULT_PORT;
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${port}`;
  }
  if (Platform.OS === 'web') {
    return `http://localhost:${port}`;
  }
  return `http://${LOCAL_IP}:${port}`;
}

export const API_BASE_URL = getApiBaseUrl();

export function getWsBaseUrl() {
  const base = getApiBaseUrl();
  return base.replace(/^http/, 'ws');
}
