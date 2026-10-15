import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

export enum AuthenticationType {
  FINGERPRINT = 1,
  FACIAL_RECOGNITION = 2,
  IRIS = 3,
}

export enum SecurityLevel {
  NONE = 0,
  SECRET = 1,
  BIOMETRIC = 2,
}

export interface LocalAuthenticationResult {
  success: boolean;
  error?: string;
  warning?: string;
}

export interface LocalAuthenticationOptions {
  promptMessage?: string;
  cancelLabel?: string;
  fallbackLabel?: string;
  disableDeviceFallback?: boolean;
}

/**
 * Kiểm tra xem thiết bị có phần cứng sinh trắc học (vân tay, Face ID) hay không
 */
export const hasHardwareAsync = async (): Promise<boolean> => {
  try {
    const { available } = await rnBiometrics.isSensorAvailable();
    return available;
  } catch (e) {
    return false;
  }
};

/**
 * Kiểm tra xem người dùng đã cài đặt/đăng ký vân tay hoặc khuôn mặt trên máy chưa
 */
export const isEnrolledAsync = async (): Promise<boolean> => {
  try {
    const { available } = await rnBiometrics.isSensorAvailable();
    return available;
  } catch (e) {
    return false;
  }
};

/**
 * Lấy danh sách kiểu xác thực sinh trắc học máy hỗ trợ
 */
export const supportedAuthenticationTypesAsync = async (): Promise<AuthenticationType[]> => {
  try {
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    if (!available) return [];

    if (biometryType === BiometryTypes.FaceID) {
      return [AuthenticationType.FACIAL_RECOGNITION];
    } else if (biometryType === BiometryTypes.TouchID || biometryType === BiometryTypes.Biometrics) {
      return [AuthenticationType.FINGERPRINT];
    }
    return [AuthenticationType.FINGERPRINT];
  } catch (e) {
    return [];
  }
};

/**
 * Kích hoạt popup xác thực sinh trắc học
 */
export const authenticateAsync = async (
  options?: LocalAuthenticationOptions,
): Promise<LocalAuthenticationResult> => {
  try {
    const promptMessage = options?.promptMessage || 'Xác thực sinh trắc học để tiếp tục';
    const cancelButtonText = options?.cancelLabel || 'Hủy';

    const { success, error } = await rnBiometrics.simplePrompt({
      promptMessage,
      cancelButtonText,
    });

    if (success) {
      return { success: true };
    }
    return { success: false, error: error || 'user_cancel' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'unknown' };
  }
};

export const getEnrolledLevelAsync = async (): Promise<SecurityLevel> => {
  const enrolled = await isEnrolledAsync();
  return enrolled ? SecurityLevel.BIOMETRIC : SecurityLevel.NONE;
};

export default {
  hasHardwareAsync,
  isEnrolledAsync,
  supportedAuthenticationTypesAsync,
  authenticateAsync,
  getEnrolledLevelAsync,
  AuthenticationType,
  SecurityLevel,
};
