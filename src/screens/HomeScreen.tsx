import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import ProductCard from '@components/ProductCard';
import LocationBadge from '@components/LocationBadge';
import { COLORS, SIZES } from '@constants/theme';
import { useAuthStore } from '@store/useAuthStore';
import { useCartStore } from '@store/useCartStore';
import { Product, ProductListSchema } from '../types/product.schema';
import type { HomeStackParamList } from '@navigation/HomeStackNavigator';
import type { MainTabParamList } from '@navigation/MainTabNavigator';
import { getReliableProductImage } from '@utils/productImages';
import { extractCleanCode } from '@services/barcodeService';

import { SHOP_PRODUCTS } from '../data/mockProducts';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'Home'>,
  BottomTabScreenProps<MainTabParamList>
>;

class NetworkError extends Error {}
class ZodValidationError extends Error {}

const PAGE_SIZE = 6;

const fetchProductsPage = async ({
  pageParam = 1,
}): Promise<{ items: Product[]; nextPage: number | null }> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const isNetworkOk = true;
      if (!isNetworkOk) {
        reject(new NetworkError('Mất kết nối mạng, vui lòng thử lại!'));
        return;
      }

      const start = (pageParam - 1) * PAGE_SIZE;
      const rawItems = SHOP_PRODUCTS.slice(start, start + PAGE_SIZE);

      const result = ProductListSchema.safeParse(rawItems);
      if (!result.success) {
        console.error('❌ Zod chặn dữ liệu bẩn từ API:', result.error.format());
        reject(new ZodValidationError('Dữ liệu sản phẩm không hợp lệ!'));
        return;
      }

      const hasMore = start + PAGE_SIZE < SHOP_PRODUCTS.length;
      resolve({ items: result.data, nextPage: hasMore ? pageParam + 1 : null });
    }, 1000);
  });
};


const HomeScreen = ({ navigation, route }: Props) => {
  const logout = useAuthStore((state) => state.logout);
  const totalQuantity = useCartStore((state) => state.totalQuantity());

  const rawScannedCode = route.params?.scannedCode;
  const scannedCode = rawScannedCode ? extractCleanCode(rawScannedCode) : undefined;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['productsInfinite'],
    queryFn: fetchProductsPage,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const allProducts = data?.pages.flatMap((page) => page.items) ?? [];

  const errorMessage =
    error instanceof ZodValidationError
      ? '⚠️ Dữ liệu sản phẩm không hợp lệ — vui lòng báo quản trị viên!'
      : '📡 Lỗi kết nối mạng — vui lòng kéo xuống để thử lại!';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER CÂN ĐỐI, HIỂN THỊ CHỮ RÕ RÀNG VÀ KHÔNG BỊ TRÀN MẤT NÚT THOÁT */}
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>Khám phá</Text>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.navigate('Cart')}
              activeOpacity={0.7}
            >
              <Text style={styles.headerBtnText}>
                Giỏ hàng ({totalQuantity})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.navigate('Scanner')}
              activeOpacity={0.7}
            >
              <Text style={styles.headerBtnText}>Quét mã</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerBtn, styles.logoutBtn]}
              onPress={logout}
              activeOpacity={0.7}
            >
              <Text style={[styles.headerBtnText, styles.logoutBtnText]}>
                Thoát
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Thẻ vị trí + phí ship */}
        <LocationBadge />

        {/* Banner thông báo mã vừa quét */}
        {scannedCode && (
          <Pressable
            onPress={() =>
              navigation.navigate('ProductDetail', { productId: scannedCode })
            }
            style={styles.scannedBanner}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', color: COLORS.text }}>
                📦 Mã vừa quét: {scannedCode}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>
                Bấm vào để xem chi tiết sản phẩm
              </Text>
            </View>
            <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Xem →</Text>
          </Pressable>
        )}

        {/* UI các trạng thái dữ liệu */}
        {isLoading && (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 50 }}
          />
        )}

        {isError && (
          <Text style={{ textAlign: 'center', marginTop: 50, color: 'red' }}>
            {errorMessage}
          </Text>
        )}

        {allProducts.length > 0 && (
          <FlashList
            data={allProducts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  navigation.navigate('ProductDetail', { productId: item.id })
                }
              >
                <ProductCard product={item} />
              </Pressable>
            )}
            numColumns={2}
            estimatedItemSize={260}
            contentContainerStyle={{ padding: SIZES.padding }}
            refreshing={isRefetching}
            onRefresh={refetch}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.primary}
                  style={{ marginVertical: 16 }}
                />
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flexShrink: 1,
    marginRight: 6,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  headerBtn: {
    height: 32,
    paddingHorizontal: 9,
    borderRadius: 6,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: COLORS.primary,
  },
  logoutBtnText: {
    color: '#FFFFFF',
  },
  scannedBanner: {
    backgroundColor: '#FFFBE6',
    borderColor: '#FFE58F',
    borderWidth: 1,
    borderRadius: SIZES.radius,
    marginHorizontal: SIZES.padding,
    marginTop: 10,
    marginBottom: 6,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default HomeScreen;