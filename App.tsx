import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@contexts/ThemeContext';
import LoginScreen from '@screens/LoginScreen';
import RegisterScreen from '@screens/RegisterScreen';
import { useAppLock } from '@hooks/useAppLock';
import BiometricGateScreen from '@screens/BiometricGateScreen';
import RootStackNavigator from '@navigation/RootStackNavigator'; // Thay cho import MainTabNavigator trực tiếp
import { useAuthStore } from '@store/useAuthStore';
import { Provider } from 'react-redux';
import { reduxStore } from '@store/redux/store';
import {
  requestNotificationPermission,
  getFcmToken,
  registerForegroundHandler,
} from '@services/pushNotificationService';

const AuthStack = createNativeStackNavigator();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Dữ liệu còn "Tươi" trong 5 phút
      retry: 2,
    },
  },
});

function App(): React.JSX.Element {
  const token = useAuthStore(state => state.token);
  const isLoading = useAuthStore(state => state.isLoading);
  const checkLocalToken = useAuthStore(state => state.checkLocalToken);

  // Cổng sinh trắc học: false = đang khoá, true = đã mở
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    checkLocalToken(); // Móc vào ổ cứng SecureStore ngay khi App vừa khởi chạy
  }, [checkLocalToken]);

  // Khi user đăng xuất (token về null), phải KHOÁ LẠI cổng.
  // Thiếu đoạn này, lần đăng nhập sau sẽ không bị hỏi sinh trắc học nữa.
  useEffect(() => {
    if (token == null) setIsUnlocked(false);
  }, [token]);

  // ➕ MỚI: canh gác App Lock — tự đặt lại isUnlocked = false nếu App ở nền quá lâu (Phần 8.12)
  useAppLock({ isUnlocked, setIsUnlocked });

  useEffect(() => {
    (async () => {
      console.log('[push] Bắt đầu khởi tạo Push Notification...');
      const granted = await requestNotificationPermission();
      console.log('[push] Trạng thái quyền thông báo:', granted);
      // Trên Android vẫn lấy được FCM Token để test kể cả khi quyền chưa bật
      await getFcmToken();
    })();

    const unsubscribe = registerForegroundHandler();
    return unsubscribe;
  }, []);

  // Nếu đang lục ổ cứng thì hiện vòng xoay Loading tràn màn hình
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF4D4F" />
      </View>
    );
  }

  // Có token (đã đăng nhập từ trước) NHƯNG chưa vượt cổng -> chặn ở đây.
  // Lưu ý: chỉ chặn khi CÓ token. Người dùng chưa đăng nhập thì đi thẳng vào Login.
  if (token != null && !isUnlocked) {
    return <BiometricGateScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Provider store={reduxStore}>
          {/* ThemeProvider giữ nguyên từ Sprint 3 (Chương 3) — không đụng vào */}
          <ThemeProvider>
            <NavigationContainer>
              {token == null ? (
                // GIỮ AuthStack Login + Register từ Chương 5 — chỉ bỏ Prop onLogin (đổi sang Zustand)
                <AuthStack.Navigator screenOptions={{ headerShown: false }}>
                  <AuthStack.Screen name="Login" component={LoginScreen} />
                  <AuthStack.Screen name="Register" component={RegisterScreen} />
                </AuthStack.Navigator>
              ) : (
                <RootStackNavigator /> // Đổi từ <MainTabNavigator /> — giờ có thêm Checkout Modal
              )}
            </NavigationContainer>
          </ThemeProvider>
        </Provider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default App;