import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeStackNavigator from '@navigation/HomeStackNavigator';
import CartScreen from '@screens/CartScreen';
import OrdersScreen from '@screens/OrdersScreen';

// Khai báo Type cho tầng Tab — cần export ra để HomeScreen dùng CompositeScreenProps
// (điều hướng "xuyên tầng" từ Home Stack sang Tab Cart cần biết cả 2 ParamList)
export type MainTabParamList = {
    HomeTab: undefined;
    Cart: undefined;
    Orders: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Trang chủ' }} />
            <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Giỏ hàng' }} />
            <Tab.Screen
                name="Orders"
                component={OrdersScreen}
                options={{
                    title: 'Đơn hàng',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="receipt-text-outline" color={color} size={size} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default MainTabNavigator;