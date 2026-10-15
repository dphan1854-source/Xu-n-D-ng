import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

/** Xin quyền hiện thông báo — khác quyền Camera/Location, đây là quyền RIÊNG cho notification. */
export const requestNotificationPermission = async (): Promise<boolean> => {
    try {
        if (Platform.OS === 'android') {
            if (Platform.Version >= 33) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
            return true;
        }

        // iOS: bung Pop-up hệ thống xin quyền banner/âm thanh/badge
        const authStatus = await messaging().requestPermission();
        return (
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
    } catch (e) {
        console.log('[push] Lỗi khi xin quyền:', e);
        return false;
    }
};

/** Lấy "địa chỉ nhà" duy nhất của app trên máy này để Server gửi thông báo đích danh. */
export const getFcmToken = async (): Promise<string | null> => {
    try {
        const token = await messaging().getToken();

        // In chữ vàng nổi bật lên Terminal Metro để dễ nhìn
        console.warn('\n' + '='.repeat(50) + '\n🔥 FCM TOKEN (COPY ĐOẠN DƯỚI ĐÂY):\n' + token + '\n' + '='.repeat(50) + '\n');

        return token;
    } catch (e: any) {
        console.error('[push] Lỗi lấy token:', e?.message || e);
        return null;
    }
};

/** App đang MỞ (foreground) — FCM KHÔNG tự vẽ banner lúc này, phải tự xử lý hiển thị. */
export const registerForegroundHandler = () =>
    messaging().onMessage(async (remoteMessage) => {
        console.log('[push] Nhận thông báo lúc app đang mở:', remoteMessage.notification);
    });

/** User bấm vào thông báo lúc app đang chạy NỀN (background, chưa bị tắt hẳn). */
export const registerBackgroundOpenHandler = (onOpen: (data: Record<string, string>) => void) =>
    messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log('[push] Mở app từ thông báo (background):', remoteMessage.data);
        onOpen(remoteMessage.data);
    });

/** App bị TẮT HẲN (killed), user bấm thông báo để mở app từ đầu (cold start). */
export const getInitialNotification = async (): Promise<Record<string, string> | null> => {
    const remoteMessage = await messaging().getInitialNotification();
    if (remoteMessage) {
        console.log('[push] App mở từ trạng thái Killed do bấm thông báo:', remoteMessage.data);
        return remoteMessage.data;
    }
    return null;
};