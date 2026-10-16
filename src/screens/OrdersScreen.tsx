import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '@api/axiosClient';
import { COLORS, SIZES } from '@constants/theme';

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

interface OrderItemSummary {
    id: string;
    total: number;
    status: string;
    createdAt: string;
}

const OrdersScreen = () => {
    const navigation = useNavigation<any>();

    const {
        data: orders = [],
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const res = await axiosClient.get<OrderItemSummary[]>('/api/orders');
            return res.data;
        },
    });

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <Text style={styles.title}>Đơn hàng của tôi</Text>

            {isLoading && (
                <View style={styles.empty}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            )}

            {!isLoading && isError && (
                <View style={styles.empty}>
                    <Text style={[styles.emptyText, { color: COLORS.error }]}>
                        Không thể tải danh sách đơn hàng. Vui lòng kéo xuống để thử lại!
                    </Text>
                </View>
            )}

            {!isLoading && !isError && orders.length === 0 && (
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>Chưa có đơn nào. Hãy đặt hàng từ Giỏ.</Text>
                </View>
            )}

            {!isLoading && orders.length > 0 && (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: SIZES.padding }}
                    refreshing={isRefetching}
                    onRefresh={refetch}
                    renderItem={({ item }) => (
                        <Pressable
                            style={styles.card}
                            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={styles.orderId}>{item.id}</Text>
                                <View style={[
                                    styles.statusBadge,
                                    item.status === 'PAID' ? styles.statusPaid : styles.statusPending
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        item.status === 'PAID' ? styles.statusPaidText : styles.statusPendingText
                                    ]}>
                                        {item.status}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.meta}>
                                {formatCurrency(item.total)}
                            </Text>
                            <Text style={styles.date}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
                        </Pressable>
                    )}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.background },
    title: {
        fontSize: SIZES.h2,
        fontWeight: '800',
        color: COLORS.primary,
        padding: SIZES.padding,
    },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyText: { color: COLORS.textLight, textAlign: 'center' },
    card: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderId: { fontWeight: '700', fontSize: SIZES.body1, color: COLORS.text },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
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
    meta: { marginTop: 6, color: COLORS.primary, fontWeight: '700', fontSize: 16 },
    date: { marginTop: 4, color: COLORS.textLight, fontSize: SIZES.body2 },
});

export default OrdersScreen;