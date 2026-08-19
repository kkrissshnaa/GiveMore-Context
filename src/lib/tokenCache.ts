import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface TokenCache {
  getToken: (key: string) => Promise<string | null>;
  saveToken: (key: string, value: string) => Promise<void>;
  clearToken?: (key: string) => Promise<void>;
}

const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        if (Platform.OS === 'web') {
          return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
        }
        const item = await SecureStore.getItemAsync(key);
        return item;
      } catch (error) {
        console.error('SecureStore getItem error:', error);
        if (Platform.OS !== 'web') {
          await SecureStore.deleteItemAsync(key).catch(() => {});
        }
        return null;
      }
    },
    saveToken: async (key: string, value: string) => {
      try {
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            localStorage.setItem(key, value);
          }
          return;
        }
        return await SecureStore.setItemAsync(key, value);
      } catch (err) {
        console.error('SecureStore setItem error:', err);
      }
    },
    clearToken: async (key: string) => {
      try {
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(key);
          }
          return;
        }
        return await SecureStore.deleteItemAsync(key);
      } catch (err) {
        console.error('SecureStore deleteItem error:', err);
      }
    },
  };
};

export const tokenCache = createTokenCache();
