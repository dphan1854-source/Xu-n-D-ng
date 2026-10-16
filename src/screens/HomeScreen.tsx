import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import ProductCard from '@components/ProductCard';
import LocationBadge from '@components/LocationBadge';
import ShopButton from '@components/ShopButton';
import { COLORS, SIZES } from '@constants/theme';
import { useAuthStore } from '@store/useAuthStore';
import { useCartStore } from '@store/useCartStore';
import { Product, ProductListSchema } from '../types/product.schema';
import { API_BASE_URL } from '@constants/api';
import type { HomeStackParamList } from '@navigation/HomeStackNavigator';
import type { MainTabParamList } from '@navigation/MainTabNavigator';
import { extractCleanCode } from '@services/barcodeService';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'Home'>,
  BottomTabScreenProps<MainTabParamList>
>;

const API_URL = `${API_BASE_URL}/api/products`;

const fetchProductsAPI = async (): Promise<Product[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Lỗi mạng từ Server NestJS');
  }
  const rawData = await response.json(); // Dữ liệu thô — chưa hề được tin tưởng, dù nó đến từ Server "của mình"

  // TRẠM KIỂM SOÁT ZOD (giống hệt Chương 6): không vì Server là "hàng nhà mình" mà bỏ qua bước kiểm duyệt này
  const result = ProductListSchema.safeParse(rawData);
  if (!result.success) {
    console.error('❌ Zod chặn dữ liệu bẩn từ Server NestJS:', result.error.format());
    throw new Error('Dữ liệu sản phẩm từ Server không hợp lệ (Zod validation failed)!');
  }

  return result.data; // Đã được Zod đảm bảo 100% đúng kiểu, an toàn tuyệt đối
};

const HomeScreen = ({ navigation, route }: Props) => {
  const logout = useAuthStore((state) => state.logout);
  const totalQuantity = useCartStore((state) => state.totalQuantity());

  const rawScannedCode = route.params?.scannedCode;
  const scannedCode = rawScannedCode ? extractCleanCode(rawScannedCode) : undefined;

  const {
    data: allProducts = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProductsAPI,
  });

  const errorMessage =
    error?.message?.includes('Zod validation failed')
      ? '⚠️ Dữ liệu sản phẩm không hợp lệ — vui lòng báo quản trị viên!'
      : '📡 Lỗi kết nối mạng — vui lòng kéo xuống để thử lại!';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER CÂN ĐỐI, HIỂN THỊ CHỮ RÕ RÀNG VÀ KHÔNG BỊ TRÀN MẤT NÚT THOÁT */}
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>Khám phá</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <ShopButton
              title="Hỏi AI"
              onPress={() => navigation.navigate('AIChat')}
              style={{ width: 80, height: 32, paddingHorizontal: 0, backgroundColor: COLORS.primary }}
              textStyle={{ fontSize: 13 }}
            />
            <ShopButton
              title="Quét Mã"
              onPress={() => navigation.navigate('Scanner')}
              style={{ width: 90, height: 32, paddingHorizontal: 0, backgroundColor: COLORS.secondary }}
              textStyle={{ fontSize: 13 }}
            />
            <ShopButton
              title="Thoát"
              onPress={logout}
              style={{ width: 70, height: 32, paddingHorizontal: 0 }}
              textStyle={{ fontSize: 13 }}
            />
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