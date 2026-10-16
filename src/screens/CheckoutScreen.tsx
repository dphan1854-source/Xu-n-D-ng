import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import axiosClient from '@api/axiosClient';
import ShopButton from '@components/ShopButton';
import { useCartStore, CartItem } from '@store/useCartStore';
import { useOrderStore } from '@store/useOrderStore';
import { useCurrentLocation } from '@hooks/useCurrentLocation';
import { hapticSuccess } from '@utils/haptics';
import {
  DEFAULT_SHIPPING_FEE,
  WAREHOUSE_COORDS,
  getDistanceKm,
  getShippingTier,
} from '@constants/shipping';
import { COLORS, SIZES } from '@constants/theme';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

type CreateOrderResponse = { id: string; status: string; total: number; createdAt: string };

const placeOrderAPI = async (items: CartItem[], total: number): Promise<CreateOrderResponse> => {
  // KHÔNG cần tự gắn header Authorization — Request Interceptor của axiosClient (Chương 6, Phần 6.6)
  // tự động đọc useAuthStore.getState().token và gắn "Bearer <token>" vào MỌI request qua axiosClient.
  const response = await axiosClient.post('/api/orders', {
    // Chỉ gửi productId + quantity — KHÔNG gửi giá. Server tự tra giá thật (Phần 9.12 mục 2).
    items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
    total,
  });

  return response.data;
};

const CheckoutScreen = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const items = useCartStore((state) => state.items);
  const totalQuantity = useCartStore((state) => state.totalQuantity());
  const totalPrice = useCartStore((state) => state.totalPrice());
  const clearCart = useCartStore((state) => state.clearCart);
  const addOrder = useOrderStore((s) => s.addOrder);

  const [isPlacing, setIsPlacing] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Gọi Hook GPS lấy toạ độ thực của khách hàng
  const { coords, loading: locationLoading } = useCurrentLocation();

  // Tính phí vận chuyển dựa trên khoảng cách GPS tới kho hàng
  const { shippingFee, shippingLabel } = useMemo(() => {
    if (!coords) {
      return {
        shippingFee: DEFAULT_SHIPPING_FEE,
        shippingLabel: 'Phí cố định (chưa có vị trí)',
      };
    }
    const distanceKm = getDistanceKm(
      coords.latitude,
      coords.longitude,
      WAREHOUSE_COORDS.latitude,
      WAREHOUSE_COORDS.longitude,
    );
    const tier = getShippingTier(distanceKm);
    return {
      shippingFee: tier.fee,
      shippingLabel: `${tier.label} (~${distanceKm.toFixed(1)} km)`,
    };
  }, [coords]);

  const handleConfirm = async () => {
    setIsPlacing(true);
    setErrorMessage(null);

    try {
      const order = await placeOrderAPI(items, totalPrice);

      setOrderId(order.id);
      setIsDone(true);
      hapticSuccess();

      addOrder({
        id: order.id,
        items: [...items],
        total: order.total,
        subtotal: totalPrice,
        shippingFee,
        status: 'PENDING',
        createdAt: order.createdAt ?? new Date().toISOString(),
      });

      queryClient.invalidateQueries({ queryKey: ['orders'] });

      clearCart(); // ⚠️ CHỈ xóa giỏ SAU KHI Server xác nhận thành công
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error: any) {
      // error.response.data.message là body lỗi mà NestJS trả về (VD "Tổng tiền không khớp...", hoặc
      // "Unauthorized" nếu Token hết hạn — lúc đó Response Interceptor ở Chương 6 đã tự bắn logout() rồi)
      const serverMessage = error?.response?.data?.message;
      const message = Array.isArray(serverMessage)
        ? serverMessage.join(', ') // ValidationPipe trả về MẢNG message
        : serverMessage ?? 'Đặt hàng thất bại, vui lòng thử lại';
      setErrorMessage(message);
    } finally {
      setIsPlacing(false);
    }
  };

  if (isDone) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successText}>Đặt hàng thành công!</Text>
          {/* khoe mã đơn hàng do Server sinh ra — bằng chứng dữ liệu đã đi hết một vòng */}
          <Text style={styles.orderIdText}>Mã đơn: {orderId}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Xác nhận đơn hàng</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.label}>Số lượng sản phẩm</Text>
          <Text style={styles.value}>{totalQuantity}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.label}>Tiền hàng</Text>
          <Text style={styles.value}>{formatCurrency(totalPrice)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.label}>Phí vận chuyển</Text>
            <Text style={styles.subLabel}>
              {locationLoading ? 'Đang xác định toạ độ...' : shippingLabel}
            </Text>
          </View>
          {locationLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.value}>{formatCurrency(shippingFee)}</Text>
          )}
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.label}>Tổng cộng</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalPrice + shippingFee)}</Text>
        </View>

        {errorMessage && <Text style={styles.errorText}>⚠️ {errorMessage}</Text>}

        {isPlacing ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />
        ) : (
          <ShopButton
            title="Xác nhận đặt hàng"
            onPress={handleConfirm}
            disabled={totalQuantity === 0}
            style={styles.confirmBtn}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: SIZES.padding },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.padding },
  title: { fontSize: SIZES.h1, fontWeight: 'bold', color: COLORS.text, marginBottom: 24 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: { fontSize: SIZES.body1, color: COLORS.textLight },
  subLabel: { fontSize: SIZES.small, color: COLORS.textLight, marginTop: 2 },
  value: { fontSize: SIZES.body1, color: COLORS.text, fontWeight: '600' },
  totalValue: { fontSize: SIZES.h2, color: COLORS.primary, fontWeight: 'bold' },
  confirmBtn: { marginTop: 32 },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successText: { fontSize: SIZES.h1, fontWeight: 'bold', color: COLORS.text },
  orderIdText: { marginTop: 8, fontSize: SIZES.body2, color: COLORS.textLight },
  errorText: { marginTop: 16, color: COLORS.error, fontSize: SIZES.body2, textAlign: 'center' },
});

export default CheckoutScreen;