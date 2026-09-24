import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ShopButton from '@components/ShopButton';
import { useCartStore } from '@store/useCartStore';
import { Product } from '../types/product.schema';
import { COLORS, SIZES } from '@constants/theme';
import type { HomeStackParamList } from '@navigation/HomeStackNavigator';
import { hapticSuccess } from '@utils/haptics';
import { findShopProduct, resolveScannedCode } from '@services/barcodeService';

type ProductDetailRouteProp = RouteProp<HomeStackParamList, 'ProductDetail'>;

interface ProductPage {
  items: Product[];
  nextPage: number | null;
}

const ProductDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ProductDetailRouteProp>();
  const { productId } = route.params;
  const queryClient = useQueryClient();
  const addItem = useCartStore((state) => state.addItem);

  const cachedData = queryClient.getQueryData<{ pages: ProductPage[] }>(['productsInfinite']);
  const cachedProducts = cachedData?.pages.flatMap((page) => page.items) ?? [];

  const [product, setProduct] = useState<Product>(() =>
    findShopProduct(productId, cachedProducts)
  );
  const [imageUri, setImageUri] = useState<string>(product.image);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(true);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Tự động phân giải sâu nếu mã quét là link QR rút gọn (me-qr.com/tc1lpu47)
  useEffect(() => {
    let isMounted = true;
    resolveScannedCode(productId).then((realCode) => {
      if (isMounted && realCode && realCode !== product.id) {
        const accurateProduct = findShopProduct(realCode, cachedProducts);
        setProduct(accurateProduct);
        setImageUri(accurateProduct.image);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const handleAddToCart = () => {
    if (product.price === 0) return;
    addItem(product);
    hapticSuccess();
    navigation.navigate('Cart');
  };

  const isUnknownProduct = product.price === 0;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${product.id}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Khung ảnh sản phẩm */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
            onLoadStart={() => setIsLoadingImage(true)}
            onLoadEnd={() => setIsLoadingImage(false)}
            onError={() => {
              setIsLoadingImage(false);
            }}
          />
          {isLoadingImage && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )}
        </View>

        {isUnknownProduct ? (
          /* Trạng thái mã không xác định (do me-qr gắn link quảng cáo rút gọn) */
          <View style={styles.errorBox}>
            <Icon name="alert-circle-outline" size={36} color={COLORS.error} />
            <Text style={styles.errorTitle}>Không tìm thấy sản phẩm trong ShopAI</Text>
            <Text style={styles.errorDesc}>
              Mã máy quét đọc được: <Text style={{ fontWeight: 'bold' }}>{product.id}</Text>
            </Text>
            <Text style={styles.errorHint}>
              💡 Nếu bạn tạo QR trên trang me-qr.com, trang đó đã tự gắn link theo dõi rút gọn ({product.id}) thay vì tạo mã trực tiếp. Hãy dùng công cụ tạo QR chuẩn dạng Plain Text (Văn bản thuần) để quét đúng 100%!
            </Text>
            <ShopButton
              title="Quay lại quét mã khác"
              onPress={() => navigation.goBack()}
              style={{ width: '100%', marginTop: 16 }}
            />
          </View>
        ) : (
          /* Trạng thái hiển thị sản phẩm chính xác */
          <View>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.price}>
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(product.price)}
            </Text>

            <View style={styles.idChipRow}>
              <View style={styles.idChip}>
                <Icon name="barcode" size={16} color={COLORS.textLight} />
                <Text style={styles.idNote}>Mã sản phẩm: {product.id}</Text>
              </View>

              <TouchableOpacity
                style={styles.viewQrBtn}
                onPress={() => setShowQrModal(true)}
                activeOpacity={0.7}
              >
                <Icon name="qrcode" size={16} color={COLORS.secondary} />
                <Text style={styles.viewQrText}>Xem mã QR chuẩn</Text>
              </TouchableOpacity>
            </View>

            <ShopButton
              title="Thêm vào giỏ hàng"
              onPress={handleAddToCart}
              style={styles.buyBtn}
            />
          </View>
        )}
      </ScrollView>

      {/* Modal hiển thị mã QR Chuẩn của sản phẩm để quét test trực tiếp */}
      <Modal visible={showQrModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Mã QR Chuẩn của sản phẩm</Text>
            <Text style={styles.modalSub}>{product.name}</Text>
            <Text style={styles.modalCode}>Dữ liệu: {product.id}</Text>

            <View style={styles.modalQrWrapper}>
              <Image
                source={{ uri: qrCodeImageUrl }}
                style={{ width: 220, height: 220 }}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.modalNote}>
              Mã này chứa chính xác chuỗi "{product.id}", không có link quảng cáo rút gọn của bên thứ 3.
            </Text>

            <ShopButton
              title="Đóng"
              onPress={() => setShowQrModal(false)}
              style={{ width: '100%', marginTop: 14 }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: SIZES.padding },
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: { width: '100%', height: '100%' },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 245, 249, 0.6)',
  },
  name: { fontSize: SIZES.h2, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  price: { fontSize: SIZES.h1, fontWeight: 'bold', color: COLORS.primary, marginBottom: 12 },
  idChipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  idChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 6,
  },
  idNote: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  viewQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#91D5FF',
  },
  viewQrText: { fontSize: 12, color: COLORS.secondary, fontWeight: '600' },
  buyBtn: { marginTop: 8 },
  errorBox: {
    backgroundColor: '#FFF2F0',
    borderColor: '#FFCCC7',
    borderWidth: 1,
    borderRadius: SIZES.radius,
    padding: 16,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.error,
    marginTop: 8,
    textAlign: 'center',
  },
  errorDesc: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 6,
  },
  errorHint: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 10,
    lineHeight: 18,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radius,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  modalSub: { fontSize: 13, color: COLORS.textLight, marginTop: 4, textAlign: 'center' },
  modalCode: { fontSize: 13, fontWeight: 'bold', color: COLORS.primary, marginTop: 2 },
  modalQrWrapper: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  modalNote: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default ProductDetailScreen;