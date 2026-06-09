import { Platform } from 'react-native';

const LOCAL_IP = '192.168.1.47';

export function getApiBaseUrl() {
  const port = 3006;
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${port}`;
  }
  if (Platform.OS === 'web') {
    return `http://localhost:${port}`;
  }
  return `http://${LOCAL_IP}:${port}`;
}

export const API_BASE_URL = getApiBaseUrl();
