import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
// ĐÚNG: SafeAreaView phải lấy từ 'react-native-safe-area-context', KHÔNG lấy từ 'react-native'
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FlashList } from "@shopify/flash-list";
import ProductCard from "@components/ProductCard";
import ShopButton from "@components/ShopButton";
import { MOCK_PRODUCTS } from "@data/mockProducts";
import { COLORS, SIZES } from "@constants/theme";
import type { HomeStackParamList } from "@navigation/HomeStackNavigator";

type HomeNavProp = NativeStackNavigationProp<HomeStackParamList, "Home">;

const HomeScreen = ({ onLogout }: { onLogout?: () => void }) => {
  const navigation = useNavigation<HomeNavProp>();

  // Giữ nguyên State & Pull-to-refresh từ Sprint 4 Bước 4.5
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Giả lập gọi lại API mất 1.5 giây — Chương 6 sẽ thay bằng refetch() thật của React Query
    setTimeout(() => {
      // Xáo ngẫu nhiên mảng để người dùng THẤY RÕ danh sách vừa "làm mới", không chỉ là loading suông
      setProducts([...MOCK_PRODUCTS].sort(() => Math.random() - 0.5));
      setRefreshing(false);
    }, 1500);
  }, []);

  return (
    // SafeAreaView của safe-area-context tự tính đúng khoảng Tai thỏ/Dynamic Island
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Header AppBar */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Khám phá</Text>
          {onLogout && (
            <ShopButton
              title="Thoát"
              onPress={onLogout}
              style={{ width: 80, height: 32, backgroundColor: COLORS.textLight }}
            />
          )}
        </View>

        {/* FlashList: thuật toán Recycling viết bằng C++ của Shopify, nhanh hơn FlatList ~10 lần */}
        <FlashList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            // Chỉ gửi productId (ID) qua navigate, không gửi nguyên object sản phẩm
            <Pressable
              onPress={() =>
                navigation.navigate("ProductDetail", { productId: item.id })
              }
            >
              <ProductCard product={item} />
            </Pressable>
          )}
          // --- CẤU HÌNH GRID 2 CỘT ---
          numColumns={2} // Chia 2 cột (khe hở đã xử lý bằng margin trong ProductCard)
          estimatedItemSize={260} // Chiều cao ước lượng 1 thẻ, giúp FlashList tính trước bộ khung Recycle
          refreshing={refreshing} // FlashList tự vẽ vòng xoay loading khi true
          onRefresh={handleRefresh} // Gọi tự động khi người dùng kéo tay xuống đầu danh sách
          contentContainerStyle={{ padding: SIZES.padding / 2 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background, // Màu nền vùng tai thỏ
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: 15,
    backgroundColor: COLORS.surface,
    flexDirection: "row", // Chuyển Flexbox sang ngang
    justifyContent: "space-between", // Đẩy title và nút thoát ra xa
    alignItems: "center", // Căn giữa theo trục phụ
  },
  headerTitle: {
    fontSize: SIZES.h1,
    fontWeight: "bold",
    color: COLORS.text,
  },
});

export default HomeScreen;