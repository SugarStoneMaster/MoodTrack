import * as SecureStore from 'expo-secure-store';

const ACCESS_SERVICE = 'moodtrack_access';
const REFRESH_SERVICE = 'moodtrack_refresh';

export async function saveAccessToken(token: string) {
  await SecureStore.setItemAsync(ACCESS_SERVICE, token);
}

export async function getAccessToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(ACCESS_SERVICE);
}

export async function deleteAccessToken() {
  await SecureStore.deleteItemAsync(ACCESS_SERVICE);
}

export async function saveRefreshToken(token: string) {
  await SecureStore.setItemAsync(REFRESH_SERVICE, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(REFRESH_SERVICE);
}

export async function clearAllTokens() {
  await SecureStore.deleteItemAsync(ACCESS_SERVICE);
  await SecureStore.deleteItemAsync(REFRESH_SERVICE);
}