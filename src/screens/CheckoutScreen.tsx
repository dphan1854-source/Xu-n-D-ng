import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

interface CreateOrderPayload {
    items: CartItem[];
    totalPrice: number;
    subtotal: number;
    shippingFee: number;
}

interface CreateOrderResponse {
    orderId: string;
    status: 'PENDING';
    total: number;
    subtotal: number;
    shippingFee: number;
}

// Ch.6: giả lập Server. Ch.9 Bước 9c: đổi thành axiosClient.post('/orders', { items, total })
const createOrderLocal = async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
    await new Promise((r) => setTimeout(r, 1200));
    return {
        orderId: `ORD-${Date.now()}`,
        status: 'PENDING',
        total: payload.totalPrice,
        subtotal: payload.subtotal,
        shippingFee: payload.shippingFee,
    };
};

const BANK_INFO = {
    bankId: 'MB',
    bankName: 'MB Bank (Quân Đội)',
    accountNo: '389198408715',
    accountName: 'PHAN XUAN DUNG',
};

const CheckoutScreen = () => {
    const navigation = useNavigation();
    const queryClient = useQueryClient();
    const items = useCartStore((state) => state.items);
    const totalQuantity = useCartStore((state) => state.totalQuantity());
    const totalPrice = useCartStore((state) => state.totalPrice());
    const clearCart = useCartStore((state) => state.clearCart);
    const addOrder = useOrderStore((s) => s.addOrder);
    const markPaid = useOrderStore((s) => s.markPaid);

    const [isPaid, setIsPaid] = useState<boolean>(false);
    const [qrLoading, setQrLoading] = useState<boolean>(true);
    const [qrError, setQrError] = useState<boolean>(false);
    // Snapshot giữ giá trị đơn hàng cố định, không bao giờ bị nhảy về 0
    const [orderSnapshot, setOrderSnapshot] = useState<CreateOrderPayload | null>(null);

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

    // Tổng tiền thanh toán = Giá sản phẩm + Phí ship
    const grandTotal = totalPrice + shippingFee;

    // useMutation: hành động GHI dữ liệu (POST /orders)
    const { mutate, isPending, isError, isSuccess, data } = useMutation({
        mutationFn: createOrderLocal,

        // onSuccess: chạy SAU KHI Server xác nhận đặt hàng thành công
        onSuccess: (res) => {
            addOrder({
                id: res.orderId,
                items: orderSnapshot?.items ?? [...items],
                total: res.total,
                subtotal: res.subtotal,
                shippingFee: res.shippingFee,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
            });
            // KHÔNG clearCart ngay lúc này để tránh làm giá nhảy về 0 trước khi thanh toán
            queryClient.invalidateQueries({ queryKey: ['productsInfinite'] });
        },

        onError: (err) => {
            console.error('❌ Đặt hàng thất bại:', err);
        },
    });

    const handleConfirm = () => {
        const payload: CreateOrderPayload = {
            items: [...items],
            totalPrice: grandTotal,
            subtotal: totalPrice,
            shippingFee,
        };
        setOrderSnapshot(payload);
        mutate(payload);
    };

    const handleMarkPaid = () => {
        if (data?.orderId) {
            markPaid(data.orderId);
            setIsPaid(true);
            clearCart(); // Đã thanh toán xong -> xóa giỏ hàng
            hapticSuccess();
        }
    };

    const handleLeaveAndClear = () => {
        clearCart();
        navigation.goBack();
    };

    // Số tiền thanh toán: cố định từ snapshot/data, không bao giờ bị nhảy về 0
    const paymentAmount = data?.total ?? orderSnapshot?.totalPrice ?? grandTotal;
    const paymentSubtotal = data?.subtotal ?? orderSnapshot?.subtotal ?? totalPrice;
    const paymentShippingFee = data?.shippingFee ?? orderSnapshot?.shippingFee ?? shippingFee;

    // Tạo URL VietQR chuẩn liên ngân hàng Napas 24/7
    const vietQrUrl = data?.orderId
        ? `https://img.vietqr.io/image/${BANK_INFO.bankId}-${BANK_INFO.accountNo}-compact2.png?amount=${paymentAmount}&addInfo=${encodeURIComponent(
            data.orderId,
        )}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`
        : '';

    // Dự phòng khi mạng chặn hoặc VietQR bảo trì
    const fallbackQrUrl = data?.orderId
        ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
            `Thanh toan don hang ${data.orderId} - So tien: ${paymentAmount} VND`,
        )}`
        : '';

    // Màn hình hiển thị mã QR Thanh toán khi đã bấm Xác nhận đặt hàng
    if (isSuccess && data) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.qrContainer} showsVerticalScrollIndicator={false}>
                    <View style={styles.successBadge}>
                        <Text style={styles.successBadgeIcon}>{isPaid ? '🎉' : '⏳'}</Text>
                        <Text style={styles.successBadgeTitle}>
                            {isPaid ? 'Đặt hàng & Thanh toán thành công!' : 'Đang chờ thanh toán'}
                        </Text>
                        <Text style={styles.successBadgeSub}>
                            {isPaid ? 'Cảm ơn bạn! Đơn hàng đã được thanh toán thành công' : 'Vui lòng quét mã VietQR dưới đây để thanh toán'}
                        </Text>
                    </View>

                    {/* Khung Mã QR */}
                    <View style={styles.qrCard}>
                        <Text style={styles.qrHeader}>VIETQR 24/7 CHUYỂN KHOẢN</Text>
                        <View style={styles.qrImageWrapper}>
                            <Image
                                source={{ uri: qrError ? fallbackQrUrl : vietQrUrl }}
                                style={styles.qrImage}
                                resizeMode="contain"
                                onLoadStart={() => setQrLoading(true)}
                                onLoadEnd={() => setQrLoading(false)}
                                onError={() => {
                                    setQrError(true);
                                    setQrLoading(false);
                                }}
                            />
                            {qrLoading && (
                                <View style={styles.qrLoader}>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                    <Text style={styles.qrLoaderText}>Đang tạo mã QR...</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.scanHint}>Mở app Ngân hàng / MoMo / ZaloPay để quét</Text>
                    </View>

                    {/* Chi tiết chuyển khoản */}
                    <View style={styles.bankDetailCard}>
                        <View style={styles.bankRow}>
                            <Text style={styles.bankLabel}>Ngân hàng:</Text>
                            <Text style={styles.bankVal}>{BANK_INFO.bankName}</Text>
                        </View>
                        <View style={styles.bankRow}>
                            <Text style={styles.bankLabel}>Chủ tài khoản:</Text>
                            <Text style={styles.bankVal}>{BANK_INFO.accountName}</Text>
                        </View>
                        <View style={styles.bankRow}>
                            <Text style={styles.bankLabel}>Số tài khoản:</Text>
                            <Text style={[styles.bankVal, styles.highlightVal]}>{BANK_INFO.accountNo}</Text>
                        </View>
                        <View style={styles.bankRow}>
                            <Text style={styles.bankLabel}>Tiền hàng:</Text>
                            <Text style={styles.bankVal}>{formatCurrency(paymentSubtotal)}</Text>
                        </View>
                        <View style={styles.bankRow}>
                            <Text style={styles.bankLabel}>Phí vận chuyển:</Text>
                            <Text style={styles.bankVal}>{formatCurrency(paymentShippingFee)}</Text>
                        </View>
                        <View style={styles.bankRow}>
                            <Text style={styles.bankLabel}>Tổng thanh toán:</Text>
                            <Text style={[styles.bankVal, styles.priceVal]}>{formatCurrency(paymentAmount)}</Text>
                        </View>
                        <View style={styles.bankRow}>
                            <Text style={styles.bankLabel}>Nội dung CK:</Text>
                            <Text style={[styles.bankVal, styles.orderIdVal]}>{data.orderId}</Text>
                        </View>
                    </View>

                    {/* Nút hành động */}
                    {isPaid ? (
                        <View style={styles.paidActionBox}>
                            <View style={styles.paidStatusBadge}>
                                <Text style={styles.paidStatusText}>✓ ĐÃ THANH TOÁN THÀNH CÔNG</Text>
                            </View>
                            <ShopButton
                                title="Về trang chủ"
                                onPress={handleLeaveAndClear}
                                style={styles.actionBtn}
                            />
                        </View>
                    ) : (
                        <View style={styles.pendingActionBox}>
                            <ShopButton
                                title="Tôi đã chuyển khoản xong"
                                onPress={handleMarkPaid}
                                style={[styles.actionBtn, { backgroundColor: COLORS.success }]}
                            />
                            <ShopButton
                                title="Để sau & Về trang chủ"
                                onPress={handleLeaveAndClear}
                                style={[styles.actionBtn, { backgroundColor: COLORS.secondary, marginTop: 10 }]}
                            />
                        </View>
                    )}
                </ScrollView>
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
                    <Text style={styles.totalValue}>{formatCurrency(grandTotal)}</Text>
                </View>

                {/* isError: hiện khi mutation thất bại */}
                {isError && (
                    <Text style={styles.errorText}>Đặt hàng thất bại — vui lòng kiểm tra mạng và bấm thử lại!</Text>
                )}

                {isPending ? (
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
    errorText: { color: COLORS.error, textAlign: 'center', marginTop: 16 },

    // QR Payment View Styles
    qrContainer: { padding: SIZES.padding, alignItems: 'center' },
    successBadge: { alignItems: 'center', marginBottom: 16 },
    successBadgeIcon: { fontSize: 48, marginBottom: 6 },
    successBadgeTitle: { fontSize: SIZES.h2, fontWeight: 'bold', color: COLORS.text },
    successBadgeSub: { fontSize: SIZES.body2, color: COLORS.textLight, marginTop: 4, textAlign: 'center' },

    qrCard: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius * 1.5,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 16,
    },
    qrHeader: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.secondary,
        letterSpacing: 1,
        marginBottom: 12,
    },
    qrImageWrapper: {
        width: 250,
        height: 250,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    qrImage: { width: '100%', height: '100%' },
    qrLoader: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrLoaderText: { marginTop: 8, fontSize: 12, color: COLORS.textLight },
    scanHint: { marginTop: 12, fontSize: SIZES.small, color: COLORS.textLight, fontStyle: 'italic' },

    bankDetailCard: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius,
        padding: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    bankRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    bankLabel: { fontSize: 13, color: COLORS.textLight },
    bankVal: { fontSize: 13, fontWeight: '600', color: COLORS.text },
    highlightVal: { color: COLORS.secondary, fontWeight: 'bold' },
    priceVal: { color: COLORS.primary, fontWeight: 'bold', fontSize: 15 },
    orderIdVal: { color: '#8E44AD', fontWeight: 'bold' },

    pendingActionBox: { width: '100%', maxWidth: 340 },
    paidActionBox: { width: '100%', maxWidth: 340, alignItems: 'center' },
    paidStatusBadge: {
        backgroundColor: '#E8F5E9',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginBottom: 16,
    },
    paidStatusText: { color: COLORS.success, fontWeight: 'bold', fontSize: 14 },
    actionBtn: { width: '100%' },
});

export default CheckoutScreen;