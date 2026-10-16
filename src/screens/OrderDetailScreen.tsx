import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@api/axiosClient';
import ShopButton from '@components/ShopButton';
import { COLORS, SIZES } from '@constants/theme';
import { RootStackParamList } from '@navigation/RootStackNavigator';
import { hapticSuccess } from '@utils/haptics';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

interface OrderDetailResponse {
    id: string;
    userId: string;
    total: number;
    status: string;
    createdAt: string;
    items: {
        id: string;
        productId: string;
        quantity: number;
        price: number;
    }[];
}

const OrderDetailScreen = ({ route }: Props) => {
    const { orderId } = route.params;
    const queryClient = useQueryClient();

    const { data: order, isLoading, isError } = useQuery<OrderDetailResponse>({
        queryKey: ['order', orderId],
        queryFn: async () => (await axiosClient.get(`/api/orders/${orderId}`)).data,
    });

    const payMutation = useMutation({
        mutationFn: async () => (await axiosClient.post(`/api/orders/${orderId}/pay`)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order', orderId] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            hapticSuccess();
        },
    });

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (isError || !order) {
        return (
            <SafeAreaView style={styles.safe}>
                <Text style={styles.missing}>Không tìm thấy hóa đơn {orderId}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.heading}>Hóa đơn</Text>
                <Text style={styles.row}>Mã: <Text style={{ fontWeight: 'bold' }}>{order.id}</Text></Text>
                <View style={styles.statusRow}>
                    <Text style={styles.row}>Trạng thái: </Text>
                    <View style={[
                        styles.statusBadge,
                        order.status === 'PAID' ? styles.statusPaid : styles.statusPending
                    ]}>
                        <Text style={[
                            styles.statusText,
                            order.status === 'PAID' ? styles.statusPaidText : styles.statusPendingText
                        ]}>
                            {order.status}
                        </Text>
                    </View>
                </View>
                <Text style={styles.row}>Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</Text>

                <Text style={[styles.heading, { marginTop: 20 }]}>Chi tiết sản phẩm</Text>
                {order.items.map((it) => (
                    <View key={it.id} style={styles.itemRow}>
                        <Text style={{ flex: 1, color: COLORS.text }}>
                            {it.productId} × {it.quantity}
                        </Text>
                        <Text style={{ fontWeight: '600', color: COLORS.text }}>
                            {formatCurrency(it.price * it.quantity)}
                        </Text>
                    </View>
                ))}

                <Text style={styles.total}>Tổng thanh toán: {formatCurrency(order.total)}</Text>

                {order.status === 'PENDING' ? (
                    <ShopButton
                        title="Thanh toán ngay (→ PAID)"
                        onPress={() => payMutation.mutate()}
                        isLoading={payMutation.isPending}
                        style={{ marginTop: 24, backgroundColor: COLORS.success }}
                    />
                ) : (
                    <Text style={styles.paidNote}>✓ Đã thanh toán thành công</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.background },
    container: { padding: SIZES.padding },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    heading: { fontSize: SIZES.h3, fontWeight: '800', color: COLORS.primary, marginBottom: 8 },
    row: { marginBottom: 4, color: COLORS.text, fontSize: 14 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusPending: {
        backgroundColor: '#FFFBE6',
        borderWidth: 1,
        borderColor: '#FFE58F',
    },
    statusPaid: {
        backgroundColor: '#E8F5E9',
        borderWidth: 1,
        borderColor: '#A5D6A7',
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    statusPendingText: {
        color: '#D48806',
    },
    statusPaidText: {
        color: COLORS.success,
    },
    itemRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    total: { marginTop: 16, fontSize: SIZES.h3, fontWeight: '800', color: COLORS.primary },
    paidNote: { marginTop: 24, color: COLORS.success, fontWeight: '700', textAlign: 'center', fontSize: 16 },
    missing: { padding: 24, color: COLORS.textLight, textAlign: 'center' },
});

export default OrderDetailScreen;