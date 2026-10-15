import * as Haptics from 'expo-haptics';

/**
 * Trung tâm điều phối rung phản hồi của ShopAI (Đã nâng cấp lên Haptics ở Chương 8).
 *
 * Nhờ đã bọc Native API vào file này từ Chương 7, toàn bộ ứng dụng
 * (nút bấm, quét mã QR, thanh toán) tự động nhận rung haptic sắc nét mà không cần sửa bất kỳ màn hình nào.
 */

// Công tắc tổng: user có thể bật/tắt trong Cài đặt
let hapticsEnabled = true;

export const setHapticsEnabled = (value: boolean) => {
    hapticsEnabled = value;
};

/** Chạm nhẹ — dùng cho các nút bấm phụ. */
export const hapticLight = () => {
    if (!hapticsEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/** Chạm vừa — dùng cho nút hành động chính (Thêm vào giỏ, Thanh toán). */
export const hapticMedium = () => {
    if (!hapticsEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

/**
 * Rung "THÀNH CÔNG" — sắc nét và sang chuẩn Haptic Engine.
 * Dùng cho quét mã vạch trúng đích, thanh toán thành công.
 */
export const hapticSuccess = () => {
    if (!hapticsEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/** Rung "LỖI" — báo lỗi khi quét hụt hoặc thanh toán thất bại. */
export const hapticError = () => {
    if (!hapticsEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};