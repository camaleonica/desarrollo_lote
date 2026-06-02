import { Platform } from 'react-native';

const LOCAL_IP = '192.168.1.47';

export function getApiBaseUrl() {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }
  return `http://${LOCAL_IP}:3000/api`;
}

export const API_BASE_URL = getApiBaseUrl();
