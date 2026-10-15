import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '@screens/HomeScreen';
import ProductDetailScreen from '@screens/ProductDetailScreen';
import ScannerScreen from '@screens/ScannerScreen';
import AIChatScreen from '@screens/AIChatScreen';

export type HomeStackParamList = {
    Home: { scannedCode?: string } | undefined;
    ProductDetail: { productId: string };
    Scanner: undefined;
    AIChat: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

// KHÔNG còn nhận Props onLogout — HomeScreen tự lấy useAuthStore().logout
const HomeStackNavigator = () => {
    return (
        <Stack.Navigator>
            {/* Dùng component= để Navigation tự tiêm navigation/route — xóa hẳn Render Prop onLogout của Chương 5 */}
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen
                name="ProductDetail"
                component={ProductDetailScreen}
                options={{ title: 'Chi tiết' }}
            />
            <Stack.Screen
                name="Scanner"
                component={ScannerScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AIChat"
                component={AIChatScreen}
                options={{ title: 'Tư vấn AI' }}
            />
        </Stack.Navigator>
    );
};

export default HomeStackNavigator;