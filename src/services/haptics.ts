import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

export enum NotificationFeedbackType {
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

export enum ImpactFeedbackStyle {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
  Soft = 'soft',
  Rigid = 'rigid',
}

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

/**
 * Rung thông báo (Success, Warning, Error)
 */
export const notificationAsync = async (
  type: NotificationFeedbackType = NotificationFeedbackType.Success,
): Promise<void> => {
  try {
    let method: any = 'notificationSuccess';
    if (type === NotificationFeedbackType.Warning) method = 'notificationWarning';
    if (type === NotificationFeedbackType.Error) method = 'notificationError';

    ReactNativeHapticFeedback.trigger(method, hapticOptions);
  } catch (e) {
    console.log('[Haptics] Lỗi rung thông báo:', e);
  }
};

/**
 * Rung va chạm (Light, Medium, Heavy, Soft, Rigid)
 */
export const impactAsync = async (
  style: ImpactFeedbackStyle = ImpactFeedbackStyle.Medium,
): Promise<void> => {
  try {
    let method: any = 'impactMedium';
    if (style === ImpactFeedbackStyle.Light) method = 'impactLight';
    if (style === ImpactFeedbackStyle.Heavy) method = 'impactHeavy';
    if (style === ImpactFeedbackStyle.Soft) method = 'soft';
    if (style === ImpactFeedbackStyle.Rigid) method = 'rigid';

    ReactNativeHapticFeedback.trigger(method, hapticOptions);
  } catch (e) {
    console.log('[Haptics] Lỗi rung va chạm:', e);
  }
};

/**
 * Rung chọn lựa (Selection tick)
 */
export const selectionAsync = async (): Promise<void> => {
  try {
    ReactNativeHapticFeedback.trigger('selection', hapticOptions);
  } catch (e) {
    console.log('[Haptics] Lỗi rung selection:', e);
  }
};

export default {
  notificationAsync,
  impactAsync,
  selectionAsync,
  NotificationFeedbackType,
  ImpactFeedbackStyle,
};
