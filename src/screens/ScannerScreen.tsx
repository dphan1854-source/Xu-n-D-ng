import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Alert,
  Linking,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ShopButton from '@components/ShopButton';
import { COLORS } from '@constants/theme';
import { hapticSuccess } from '@utils/haptics';
import { extractCleanCode, resolveScannedCode } from '@services/barcodeService';

type PermissionState = 'checking' | 'granted' | 'denied';

const ScannerScreen = ({ navigation }: any) => {
  const [permission, setPermission] = useState<PermissionState>('checking');
  const device = useCameraDevice('back');
  const isFocused = useIsFocused();
  const isScanning = useRef(false);

  useEffect(() => {
    if (isFocused) {
      isScanning.current = false;
    }
  }, [isFocused]);

  const requestPermission = useCallback(async () => {
    const current = Camera.getCameraPermissionStatus();
    if (current === 'granted') {
      setPermission('granted');
      return;
    }

    const status = await Camera.requestCameraPermission();
    setPermission(status === 'granted' ? 'granted' : 'denied');
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') requestPermission();
    });
    return () => sub.remove();
  }, [requestPermission]);

  const openAppSettings = () => {
    Alert.alert(
      'Cần quyền Camera',
      'Bạn đã từ chối quyền Camera nên ShopAI không thể quét mã. Hãy vào Cài đặt > ShopAI và bật lại quyền Camera nhé.',
      [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() },
      ],
    );
  };

  const codeScanner = useCodeScanner({
    codeTypes: [
      'qr',
      'ean-13',
      'ean-8',
      'upc-a',
      'upc-e',
      'code-128',
      'code-39',
      'code-93',
      'codabar',
      'data-matrix',
    ],
    onCodeScanned: (codes) => {
      if (isScanning.current) return;
      if (codes.length === 0) return;

      const value = codes[0].value;
      if (!value) return;

      isScanning.current = true;
      hapticSuccess();

      resolveScannedCode(value)
        .then((cleanId) => {
          navigation.navigate('ProductDetail', { productId: cleanId });
        })
        .catch(() => {
          navigation.navigate('ProductDetail', { productId: extractCleanCode(value) });
        });
    },
  });

  if (permission === 'checking') {
    return (
      <View style={styles.center}>
        <Text style={styles.stateText}>Đang kiểm tra quyền Camera...</Text>
      </View>
    );
  }

  if (permission === 'denied') {
    return (
      <View style={styles.center}>
        <Text style={styles.deniedTitle}>Chưa có quyền Camera</Text>
        <Text style={styles.deniedDesc}>
          ShopAI cần Camera để quét mã sản phẩm.
        </Text>
        <ShopButton
          title="Mở Cài đặt"
          onPress={openAppSettings}
          style={{ width: 200, marginBottom: 12 }}
        />
        <ShopButton
          title="Quay lại"
          onPress={() => navigation.goBack()}
          style={{ width: 200, backgroundColor: COLORS.secondary }}
        />
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.stateText}>Thiết bị không có Camera sau!</Text>
        <ShopButton
          title="Quay lại"
          onPress={() => navigation.goBack()}
          style={{ width: 200, marginTop: 16 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused}
        codeScanner={codeScanner}
      />

      {/* 1. Thanh điều hướng trên cùng */}
      <SafeAreaView style={styles.topHeaderWrapper} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quét mã sản phẩm</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      {/* 2. KHUNG NGẮM CĂN CHÍNH GIỮA TRUNG TÂM MÀN HÌNH (CÂN CẢ DÀI VÀ RỘNG) */}
      <View style={styles.centerViewport} pointerEvents="none">
        <View style={styles.frame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
        <Text style={styles.instruction}>
          Căn chỉnh mã vạch / QR vào giữa khung hình
        </Text>
      </View>

      {/* 3. NÚT HỦY BỎ NẰM ĐÁY MÀN HÌNH - TUYỆT ĐỐI KHÔNG ĐÈ LÊN DÒNG CĂN CHỈNH */}
      <SafeAreaView style={styles.bottomWrapper} edges={['bottom']}>
        <ShopButton
          title="Hủy bỏ"
          onPress={() => navigation.goBack()}
          style={styles.cancelBtn}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  stateText: { fontSize: 16, marginBottom: 12, textAlign: 'center' },
  deniedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.error,
  },
  deniedDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  topHeaderWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  centerViewport: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 65, // Hạ thấp khung ngắm xuống vị trí tầm tay vừa vặn và cân đối
  },
  frame: {
    width: 250,
    height: 250,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#00E676',
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 18,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 18,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 18,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 18,
  },
  instruction: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    overflow: 'hidden',
    textAlign: 'center',
  },
  bottomWrapper: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  cancelBtn: {
    width: 140,
    height: 40,
    backgroundColor: 'rgba(255, 77, 79, 0.9)',
    borderRadius: 20,
  },
});

export default ScannerScreen;