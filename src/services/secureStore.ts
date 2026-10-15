import EncryptedStorage from 'react-native-encrypted-storage';

/**
 * Lớp bọc tương thích 100% với expo-secure-store cho dự án Bare React Native CLI.
 * Dưới tầng Android: dùng Android Keystore (EncryptedSharedPreferences - AES 256 GCM)
 * Dưới tầng iOS: dùng iOS Keychain Services
 */

export const setItemAsync = async (key: string, value: string): Promise<void> => {
  try {
    await EncryptedStorage.setItem(key, value);
  } catch (error) {
    console.error(`[SecureStore] Lỗi khi lưu key "${key}":`, error);
    throw error;
  }
};

export const getItemAsync = async (key: string): Promise<string | null> => {
  try {
    const value = await EncryptedStorage.getItem(key);
    return value ?? null;
  } catch (error) {
    console.error(`[SecureStore] Lỗi khi đọc key "${key}":`, error);
    return null;
  }
};

export const deleteItemAsync = async (key: string): Promise<void> => {
  try {
    await EncryptedStorage.removeItem(key);
  } catch (error) {
    console.error(`[SecureStore] Lỗi khi xóa key "${key}":`, error);
    throw error;
  }
};

export default {
  setItemAsync,
  getItemAsync,
  deleteItemAsync,
};
